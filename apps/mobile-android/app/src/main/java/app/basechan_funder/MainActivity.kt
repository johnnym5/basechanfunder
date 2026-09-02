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
        
        webView.loadUrl("https://appassets.androidplatform.net/index.html")
    }

    inner class AndroidInterface {
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

                val result = scanInboxForUbaBalance(mask)
                if (result != null) {
                    updateSmsBalance(result.first, result.second, result.third)
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

    private fun scanInboxForUbaBalance(mask: String): Triple<Double, String, Long>? {
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
                
                // Filter for UBA
                if (address.contains("UBA", ignoreCase = true) || address.contains("UBAGroup", ignoreCase = true)) {
                    val balancePattern = Pattern.compile("(?:Bal|Avail\\s*Bal)\\s*:\\s*NGN\\s*([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE)
                    // UBA often uses Ac: followed by masked account
                    val acctPattern = Pattern.compile("Ac\\s*:\\s*[\\w\\.\\*]*($mask)", Pattern.CASE_INSENSITIVE)
                    
                    val balMatcher = balancePattern.matcher(body)
                    val acctMatcher = acctPattern.matcher(body)
                    
                    if (balMatcher.find() && acctMatcher.find()) {
                        val balanceStr = balMatcher.group(1) ?: ""
                        val balance = balanceStr.replace(",", "").toDoubleOrNull()
                        if (balance != null) {
                            return Triple(balance, mask, date)
                        }
                    }
                }
            }
        }
        return null
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
