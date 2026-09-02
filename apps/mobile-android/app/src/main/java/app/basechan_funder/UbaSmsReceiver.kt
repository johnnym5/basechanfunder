package app.basechan_funder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import java.util.regex.Pattern

class UbaSmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (sms in messages) {
                val sender = sms.displayOriginatingAddress ?: ""
                val body = sms.displayMessageBody ?: ""
                val timestamp = sms.timestampMillis

                Log.d("UbaSmsReceiver", "Incoming SMS from $sender: $body")

                // Filter for UBA Sender
                if (isUbaSender(sender)) {
                    parseUbaBalance(body, timestamp)
                }
            }
        }
    }

    private fun isUbaSender(sender: String): Boolean {
        val ubaTags = listOf("UBA", "UBAGroup", "UBAMobile")
        return ubaTags.any { sender.contains(it, ignoreCase = true) }
    }

    private fun parseUbaBalance(body: String, timestamp: Long) {
        val balancePattern = Pattern.compile("(?:Bal|Avail\\s*Bal)\\s*:\\s*NGN\\s*([\\d,]+\\.\\d{2})", Pattern.CASE_INSENSITIVE)
        val acctPattern = Pattern.compile("Ac\\s*:\\s*[\\w\\.\\*]*(\\d{4})", Pattern.CASE_INSENSITIVE)
        
        val balMatcher = balancePattern.matcher(body)
        val acctMatcher = acctPattern.matcher(body)

        if (balMatcher.find()) {
            val balanceStr = balMatcher.group(1) ?: ""
            val cleanBalance = balanceStr.replace(",", "")
            val balance = cleanBalance.toDoubleOrNull()
            
            val mask = if (acctMatcher.find()) acctMatcher.group(1) ?: "Unknown" else "Unknown"

            if (balance != null) {
                Log.i("UbaSmsReceiver", "Extracted Balance: $balance for account $mask")
                MainActivity.instance?.updateSmsBalance(balance, mask, timestamp)
            }
        }
    }
}
