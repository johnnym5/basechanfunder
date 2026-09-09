/**
 * Adaptive Multi-Bank Fuzzy SMS Ingestion Engine
 * Handles extraction of financial entities across multiple Nigerian bank formats.
 */

export interface StatementTransaction {
  id: string;
  timestamp: string;      // ISO String
  description: string;
  type: 'CREDIT' | 'DEBIT';
  amountNgn: number;
  runningBalanceNgn: number;
  rawSmsText?: string;
}

const BANK_SENDERS = ['UBA', 'UBALERT', 'PARALLEX', 'GTBANK', 'ACCESS', 'ZENITH', 'FIRSTBANK', 'BANKALERT'];

export class FuzzySmsParser {
  /**
   * Parses a collection of SMS messages into a standardized transaction array.
   * Limits to the last 10 valid financial alerts.
   */
  public static parseLastTransactions(messages: { sender: string; body: string; date: number }[]): StatementTransaction[] {
    const transactions: StatementTransaction[] = [];

    // Filter by bank senders and sort by date descending
    const validMessages = messages
      .filter(msg => BANK_SENDERS.some(s => msg.sender.toUpperCase().includes(s)))
      .sort((a, b) => b.date - a.date);

    for (const msg of validMessages) {
      if (transactions.length >= 10) break;

      const parsed = this.parseSingle(msg.body, msg.date);
      if (parsed) {
        transactions.push(parsed);
      }
    }

    return transactions;
  }

  /**
   * Flexible / Masked Account Number Matching
   * Supports UBA: Ac:2XX..54X, Acc:***9543, ****9543
   */
  public static isAccountMatch(body: string, linkedAccNo: string): boolean {
    const last4 = linkedAccNo.replace(/\D/g, '').slice(-4); // "9543"
    const last2 = last4.slice(-2); // "43"
    const last2Inner = last4.slice(1, 3); // "54" from "9543" - matches UBA's 2XX..54X pattern

    // Match standard digits OR UBA masked formats like "2XX..54X" or "2XX..43X" or "****9543"
    // Pattern looking for 4-digit tail OR 2-digit tail OR 2-digit inner UBA mask
    const accountRegex = new RegExp(`(?:Ac|Acc|Account)?\\s*:?\\s*[0-9X\\.\\*]*(${last4}|${last2}|${last2Inner})[X\\.]*`, 'i');
    return accountRegex.test(body);
  }

  public static parseBalance(body: string): number | null {
    // Strict Bal extraction to avoid picking up transaction Amt
    const balMatch = body.match(/(?:Bal|Balance|Avail\s*Bal|Ledger|New\s*Bal)\s*:?\s*(?:NGN|₦)?\s*([0-9,]+\.[0-9]{2})/i);
    return balMatch ? parseFloat(balMatch[1].replace(/,/g, '')) : null;
  }

  /**
   * Executes a tiered inspection strategy to find the latest balance.
   * Gracefully falls back to the most recent alert if strict matching fails.
   */
  public static findLatestBalance(
    messages: { sender: string; body: string; date: number }[],
    linkedAccNo: string,
    bankName: string
  ): { balance: number; isFallback: boolean; sender: string; timestamp: number } | null {
    // 1. Filter by Bank Sender
    const bankMessages = messages
      .filter(m => BANK_SENDERS.some(s => m.sender.toUpperCase().includes(s)))
      .sort((a, b) => b.date - a.date);

    if (bankMessages.length === 0) return null;

    // 2. Step 2: Flexible / Masked Account Number Matching
    const accountMatch = bankMessages.find(m => this.isAccountMatch(m.body, linkedAccNo));
    if (accountMatch) {
      const balance = this.parseBalance(accountMatch.body);
      if (balance !== null) {
        return { balance, isFallback: false, sender: accountMatch.sender, timestamp: accountMatch.date };
      }
    }

    // 3. Step 3: Graceful Fallback (Latest Transaction Balance Extractor)
    // Take the most recent alert from that bank sender ID, even if account tail doesn't strictly match
    for (const msg of bankMessages) {
      const balance = this.parseBalance(msg.body);
      if (balance !== null) {
        return { balance, isFallback: true, sender: msg.sender, timestamp: msg.date };
      }
    }

    return null;
  }

  private static parseSingle(body: string, date: number): StatementTransaction | null {
    // 1. Transaction Type
    let type: 'CREDIT' | 'DEBIT' | null = null;
    if (/(?:CR|Credit|Credited|Received|Deposit)/i.test(body)) {
      type = 'CREDIT';
    } else if (/(?:DR|Debit|Debited|Sent|Withdrawal|Purchase)/i.test(body)) {
      type = 'DEBIT';
    }
    if (!type) return null;

    // 2. Amount (NGN) - Txn Amount
    const amtMatch = body.match(/(?:Amt|Amount|Txn\s*Amt|CR|DR|Val)\s*:?\s*(?:NGN|₦)?\s*([0-9,]+\.[0-9]{2})/i);
    if (!amtMatch) return null;
    const amountNgn = parseFloat(amtMatch[1].replace(/,/g, ''));

    // 3. Running Balance (NGN)
    const runningBalanceNgn = this.parseBalance(body) || 0;

    // 4. Description / Reference
    const descMatch = body.match(/(?:Desc|Ref|Remarks|Info)\s*:\s*(.+?)(?:\s*(?:Amt|Bal|Date)|$)/i);
    const description = descMatch ? descMatch[1].trim() : 'Transaction Alert';

    return {
      id: `txn_${date}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(date).toISOString(),
      description,
      type,
      amountNgn,
      runningBalanceNgn,
      rawSmsText: body
    };
  }

  /**
   * Formats a timestamp for display (DD/MM/YYYY hh:mm A)
   */
  public static formatTimestamp(isoString: string): string {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  }
}
