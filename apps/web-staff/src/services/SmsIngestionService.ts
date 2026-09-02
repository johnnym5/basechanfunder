/**
 * SMS Ingestion Service
 * Handles matching and parsing of financial SMS alerts across multiple banks.
 */

export interface ParsedSms {
  bankName: string;
  balanceNgn: number;
  accountMask: string;
  receivedAt: string;
}

const BANK_PARSERS: Record<string, { sender: RegExp; balance: RegExp; account: RegExp }> = {
  "United Bank for Africa (UBA)": {
    sender: /UBA|UBAGroup|UBAMobile/i,
    balance: /Bal:\s*NGN\s*([\d,]+\.\d{2})/i,
    account: /Acct\s*[\d\*]*(\d{4})/i
  },
  "Guaranty Trust Bank (GTB)": {
    sender: /GTBank|GTB/i,
    balance: /Bal:\s*NGN\s*([\d,]+\.\d{2})/i,
    account: /Acct:\s*[\d\*]*(\d{4})/i
  },
  "Access Bank": {
    sender: /AccessBank|Access/i,
    balance: /Avail\s*Bal:\s*NGN\s*([\d,]+\.\d{2})/i,
    account: /Acct:\s*[\d\*]*(\d{4})/i
  },
  "Zenith Bank": {
    sender: /ZenithBank|Zenith/i,
    balance: /Bal:\s*NGN\s*([\d,]+\.\d{2})/i,
    account: /Ac:\s*[\d\*]*(\d{4})/i
  },
  "First Bank of Nigeria": {
    sender: /FirstBank|FBN/i,
    balance: /Bal:\s*NGN\s*([\d,]+\.\d{2})/i,
    account: /Acct:\s*[\d\*]*(\d{4})/i
  }
};

export class SmsIngestionService {
  /**
   * Verifies if the SMS account mask matches the provided account number's last 4 digits.
   */
  public static verifyMatch(smsMask: string, fullAccountNumber: string): boolean {
    if (!smsMask || smsMask === 'XXXX' || !fullAccountNumber) return false;
    const lastFour = fullAccountNumber.slice(-4);
    return smsMask === lastFour;
  }
}
