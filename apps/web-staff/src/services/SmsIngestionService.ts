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
    balance: /(?:Bal|Avail\s*Bal|Balance)\s*[:\s]*NGN\s*([\d,]+\.\d{2})/i,
    account: /(?:Acct|Ac|A\/c|Account)\s*[:\s]*[\d\*]*(\d{4})/i
  },
  "Guaranty Trust Bank (GTB)": {
    sender: /GTBank|GTB/i,
    balance: /(?:Bal|Avail\s*Bal|Balance)\s*[:\s]*NGN\s*([\d,]+\.\d{2})/i,
    account: /(?:Acct|Ac|A\/c|Account)\s*[:\s]*[\d\*]*(\d{4})/i
  },
  "Access Bank": {
    sender: /AccessBank|Access/i,
    balance: /(?:Bal|Avail\s*Bal|Balance)\s*[:\s]*NGN\s*([\d,]+\.\d{2})/i,
    account: /(?:Acct|Ac|A\/c|Account)\s*[:\s]*[\d\*]*(\d{4})/i
  },
  "Zenith Bank": {
    sender: /ZenithBank|Zenith/i,
    balance: /(?:Bal|Avail\s*Bal|Balance)\s*[:\s]*NGN\s*([\d,]+\.\d{2})/i,
    account: /(?:Acct|Ac|A\/c|Account)\s*[:\s]*[\d\*]*(\d{4})/i
  },
  "First Bank of Nigeria": {
    sender: /FirstBank|FBN/i,
    balance: /(?:Bal|Avail\s*Bal|Balance)\s*[:\s]*NGN\s*([\d,]+\.\d{2})/i,
    account: /(?:Acct|Ac|A\/c|Account)\s*[:\s]*[\d\*]*(\d{4})/i
  },
  "Parallex Bank": {
    sender: /Parallex|ParallexBank/i,
    balance: /(?:Bal|Balance)\s*:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    account: /(?:Acct|Ac|A\/c|Account)\s*[:\s]*[\d\*]*(\d{4})/i
  }
};

export class SmsIngestionService {
  /**
   * Parses a raw SMS alert.
   */
  public static parse(sender: string, body: string, selectedBank: string): ParsedSms | null {
    const parser = BANK_PARSERS[selectedBank];
    if (!parser) return null;

    const balMatch = body.match(parser.balance);
    const acctMatch = body.match(parser.account);

    if (!balMatch) return null;

    return {
      bankName: selectedBank,
      balanceNgn: parseFloat(balMatch[1].replace(/,/g, '')),
      accountMask: acctMatch ? acctMatch[1] : 'XXXX',
      receivedAt: new Date().toISOString()
    };
  }

  /**
   * Verifies if the SMS account mask matches the provided account number's last 4 digits.
   */
  public static verifyMatch(smsMask: string, fullAccountNumber: string): boolean {
    if (!smsMask || smsMask === 'XXXX' || !fullAccountNumber) return false;
    const lastFour = fullAccountNumber.slice(-4);
    return smsMask === lastFour;
  }
}
