/**
 * UBA SMS Parser Engine
 * Handles extraction of balance and transaction data from United Bank for Africa alerts.
 */

export interface ExtractedAlert {
  bankName: string;
  accountMask: string;
  transactionType: 'CREDIT' | 'DEBIT' | 'UNKNOWN';
  amount?: number;
  extractedBalanceNgn: number;
  timestamp: number;
}

export class UbaSmsParser {
  private static SENDER_REGEX = /UBA|UBAGroup|UBAMobile/i;

  // Patterns:
  // Credit: Acct 201****4921 Amt: NGN 500,000.00 Date: 02-Sep-2026 Avail Bal: NGN 18,950,000.00
  // Debit: Acct 201****4921 Amt: NGN 100,000.00 Date: 02-Sep-2026 Bal: NGN 18,850,000.00
  private static BALANCE_PATTERN = /Bal:\s*NGN\s*([\d,]+\.\d{2})/i;
  private static ACCT_PATTERN = /Acct\s*[\d\*]*(\d{4})/i;
  private static AMOUNT_PATTERN = /Amt:\s*NGN\s*([\d,]+\.\d{2})/i;

  /**
   * Main entry point for parsing a raw SMS body.
   */
  public static parse(sender: String, body: string): ExtractedAlert | null {
    if (!this.SENDER_REGEX.test(sender.toString())) {
      return null;
    }

    const acctMatch = body.match(this.ACCT_PATTERN);
    const balMatch = body.match(this.BALANCE_PATTERN);
    const amtMatch = body.match(this.AMOUNT_PATTERN);

    if (!balMatch) return null;

    const balanceNgn = parseFloat(balMatch[1].replace(/,/g, ''));
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : undefined;
    const accountMask = acctMatch ? acctMatch[1] : 'Unknown';

    let transactionType: 'CREDIT' | 'DEBIT' | 'UNKNOWN' = 'UNKNOWN';
    if (body.toLowerCase().includes('credit')) transactionType = 'CREDIT';
    else if (body.toLowerCase().includes('debit')) transactionType = 'DEBIT';

    return {
      bankName: 'UBA',
      accountMask,
      transactionType,
      amount,
      extractedBalanceNgn: balanceNgn,
      timestamp: Date.now()
    };
  }
}
