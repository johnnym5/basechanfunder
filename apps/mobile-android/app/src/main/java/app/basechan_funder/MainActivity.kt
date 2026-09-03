package app.basechan_funder

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.JavascriptInterface
import android.net.Uri
import android.database.Cursor
import android.provider.Telephony
import android.util.Log
import android.content.pm.PackageManager
import android.Manifest
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import android.content.Intent
import java.util.regex.Pattern

class MainActivity : ComponentActivity() {
    companion object {
        var instance: MainActivity? = null
    }

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this
        enableEdgeToEdge()
        
        // Enable remote debugging for development
        WebView.setWebContentsDebuggingEnabled(true)

        webView = WebView(this)
        
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString()
                if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                    if (!url.startsWith("https://appassets.androidplatform.net")) {
                        return false 
                    }
                }
                return super.shouldOverrideUrlLoading(view, request)
            }
        }
        
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true

        // Register the JS Bridge
        webView.addJavascriptInterface(AndroidInterface(), "AndroidBridge")

        setContentView(webView)
        
        // Handle deep link from intent extras if present
        val deepLink = intent.getStringExtra("deepLinkRoute")
        val finalUrl = if (deepLink != null) {
            "https://appassets.androidplatform.net/index.html#$deepLink"
        } else {
            "https://appassets.androidplatform.net/index.html"
        }
        
        webView.loadUrl(finalUrl)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.getStringExtra("deepLinkRoute")?.let { route ->
            webView.post {
                webView.evaluateJavascript("window.location.hash = '$route'", null)
            }
        }
    }

    inner class AndroidInterface {
        @JavascriptInterface
        fun getVersionCode(): Int {
            return try {
                val pInfo = packageManager.getPackageInfo(packageName, 0)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                    pInfo.longVersionCode.toInt()
                } else {
                    @Suppress("DEPRECATION")
                    pInfo.versionCode
                }
            } catch (e: Exception) {
                0
            }
        }

        @JavascriptInterface
        fun installApkFromUrl(url: String) {
            Log.d("MainActivity", "installApkFromUrl: $url")
            // In a production environment, this would trigger a DownloadManager request
            // and an Intent to install the package via FileProvider.
            // For now, we log it clearly.
        }

        @JavascriptInterface
        fun triggerSmsSync(mask: String) {
            Log.d("MainActivity", "triggerSmsSync called for mask: $mask")
            
            try {
                // Check for SMS permissions at runtime
                if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this@MainActivity, arrayOf(Manifest.permission.READ_SMS), 101)
                    webView.post {
                        webView.evaluateJavascript("window.onSmsSyncFailed?.('$mask', 'PERMISSION_DENIED')", null)
                    }
                    return
                }

                val result = scanInboxForBankBalance(mask)
                if (result != null) {
                    updateSmsBalance(result.balance, result.mask, result.timestamp)
                    // Requirement: Post to backend
                    postSmsSyncToBackend(result)
                } else {
                    webView.post {
                        webView.evaluateJavascript("window.onSmsSyncFailed?.('$mask', 'NOT_FOUND')", null)
                    }
                }
            } catch (e: Exception) {
                Log.e("MainActivity", "Error during SMS sync", e)
                webView.post {
                    webView.evaluateJavascript("window.onSmsSyncFailed?.('$mask', 'ERROR')", null)
                }
            }
        }
    }

    data class SmsScanResult(
        val balance: Double,
        val mask: String,
        val timestamp: Long,
        val bankName: String
    )

    private fun scanInboxForBankBalance(targetMask: String): SmsScanResult? {
        val uri = Uri.parse("content://sms/inbox")
        val cursor: Cursor? = contentResolver.query(uri, null, null, null, "date DESC")
        
        cursor?.use {
            val addressIdx = it.getColumnIndex("address")
            val bodyIdx = it.getColumnIndex("body")
            val dateIdx = it.getColumnIndex("date")
            
            while (it.moveToNext()) {
                val address = it.getString(addressIdx) ?: ""
                val body = it.getString(bodyIdx) ?: ""
                val date = it.getLong(dateIdx)
                
                val bankName = identifyBank(address) ?: continue

                // Broad pattern to capture balance NGN 1,234.56 - Removed 'Amt' to prevent capturing charge amount
                val balancePattern = Pattern.compile("(?:Bal|Avail\\s*Bal|Balance)\\s*[:\\s]*(?:NGN|₦)?\\s*([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE)
                // Broad pattern to capture account mask (last 4 digits)
                val acctPattern = Pattern.compile("(?:Acct|Ac|A/c|Account)\\s*[:\\s]*[\\w\\.\\*]*(\\d{4})", Pattern.CASE_INSENSITIVE)
                
                val balMatcher = balancePattern.matcher(body)
                val acctMatcher = acctPattern.matcher(body)
                
                if (balMatcher.find()) {
                    val balanceStr = balMatcher.group(1) ?: ""
                    val balance = balanceStr.replace(",", "").toDoubleOrNull()
                    
                    val mask = if (acctMatcher.find()) acctMatcher.group(1) ?: "XXXX" else "XXXX"

                    if (balance != null) {
                        Log.i("MainActivity", "Extracted $bankName Balance: $balance for account $mask")
                        return SmsScanResult(balance, mask, date, bankName)
                    }
                }
            }
        }
        return null
    }

    private fun identifyBank(sender: String): String? {
        return when {
            sender.contains("UBA", true) || sender.contains("UBAGroup", true) -> "United Bank for Africa (UBA)"
            sender.contains("GTBank", true) || sender.contains("GTB", true) -> "Guaranty Trust Bank (GTB)"
            sender.contains("Access", true) -> "Access Bank"
            sender.contains("Zenith", true) -> "Zenith Bank"
            sender.contains("FirstBank", true) || sender.contains("FBN", true) -> "First Bank of Nigeria"
            sender.contains("Parallex", true) -> "Parallex Bank"
            sender.contains("Kuda", true) -> "Kuda MFB"
            else -> null
        }
    }

    private fun postSmsSyncToBackend(result: SmsScanResult) {
        // Implementation for posting to /api/v1/accounts/sms-sync
        // Using a simple thread for demo purposes
        Thread {
            try {
                val url = Uri.parse("http://10.0.2.2:3000/api/v1/accounts/sms-sync") // Emulator localhost
                val connection = java.net.URL(url.toString()).openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val jsonPayload = """
                    {
                        "accountMask": "${result.mask}",
                        "balanceNgn": ${result.balance},
                        "bankName": "${result.bankName}",
                        "source": "SMS_INGESTION",
                        "timestamp": "${java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(java.util.Date(result.timestamp))}"
                    }
                """.trimIndent()

                connection.outputStream.write(jsonPayload.toByteArray())
                val responseCode = connection.responseCode
                Log.d("MainActivity", "Backend Post Status: $responseCode")
                connection.disconnect()
            } catch (e: Exception) {
                Log.e("MainActivity", "Failed to post SMS sync to backend", e)
            }
        }.start()
    }

    fun updateSmsBalance(balance: Double, mask: String, timestamp: Long) {
        webView.post {
            webView.evaluateJavascript("window.onSmsBalanceUpdate?.($balance, '$mask', $timestamp)", null)
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
