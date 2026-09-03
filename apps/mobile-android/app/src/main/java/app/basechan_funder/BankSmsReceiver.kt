package app.basechan_funder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Telephony
import android.util.Log
import java.util.regex.Pattern

class BankSmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (sms in messages) {
                val sender = sms.displayOriginatingAddress ?: ""
                val body = sms.displayMessageBody ?: ""
                val timestamp = sms.timestampMillis

                Log.d("BankSmsReceiver", "Incoming SMS from $sender: $body")

                val bankName = identifyBank(sender)
                if (bankName != null) {
                    parseBankBalance(bankName, body, timestamp)
                }
            }
        }
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

    private fun parseBankBalance(bankName: String, body: String, timestamp: Long) {
        // Broad pattern to capture balance NGN 1,234.56 - Removed 'Amt' to prevent capturing charge amount as balance
        val balancePattern = Pattern.compile("(?:Bal|Avail\\s*Bal|Balance)\\s*[:\\s]*(?:NGN|₦)?\\s*([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE)
        // Broad pattern to capture account mask (last 4 digits)
        val acctPattern = Pattern.compile("(?:Acct|Ac|A/c|Account)\\s*[:\\s]*[\\w\\.\\*]*(\\d{4})", Pattern.CASE_INSENSITIVE)
        
        val balMatcher = balancePattern.matcher(body)
        val acctMatcher = acctPattern.matcher(body)

        if (balMatcher.find()) {
            val balanceStr = balMatcher.group(1) ?: ""
            val cleanBalance = balanceStr.replace(",", "")
            val balance = cleanBalance.toDoubleOrNull()
            
            val mask = if (acctMatcher.find()) acctMatcher.group(1) ?: "XXXX" else "XXXX"

            if (balance != null) {
                Log.i("BankSmsReceiver", "Extracted $bankName Balance: $balance for account $mask")
                MainActivity.instance?.updateSmsBalance(balance, mask, timestamp)
                postSmsSyncToBackend(balance, mask, timestamp, bankName)
            }
        }
    }

    private fun postSmsSyncToBackend(balance: Double, mask: String, timestamp: Long, bankName: String) {
        Thread {
            try {
                val url = Uri.parse("http://10.0.2.2:3000/api/v1/accounts/sms-sync")
                val connection = java.net.URL(url.toString()).openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val jsonPayload = """
                    {
                        "accountMask": "$mask",
                        "balanceNgn": $balance,
                        "bankName": "$bankName",
                        "source": "SMS_INGESTION",
                        "timestamp": "${java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(java.util.Date(timestamp))}"
                    }
                """.trimIndent()

                connection.outputStream.write(jsonPayload.toByteArray())
                val responseCode = connection.responseCode
                Log.d("BankSmsReceiver", "Backend Post Status: $responseCode")
                connection.disconnect()
            } catch (e: Exception) {
                Log.e("BankSmsReceiver", "Failed to post SMS sync to backend", e)
            }
        }.start()
    }
}
