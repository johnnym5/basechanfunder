import { Injectable, Logger } from '@nestjs/common';

export interface OpenBankingPayload {
  account_id: string;
  provider: string;
  balances: Array<{
    date: string;
    amount: number;
    currency: string;
  }>;
}

export interface StatementUploadPayload {
  user_id: string;
  file_name: string;
  file_buffer_base64: string;
}

export interface SMSWebhookPayload {
  accountMask: string;
  balanceNgn: number;
  bankName: string;
  source: 'SMS_INGESTION';
  timestamp: string;
  userId?: string;
}

export interface DebitWaterfallResult {
  totalBalanceNgn: number;
  orgTopUpCapitalNgn: number;
  userPersonalEquityNgn: number;
  isCapitalBreached: boolean;
  studentStatus?: string;
  isTimerPaused?: boolean;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  async processAccountDebit(
    accountId: string,
    debitAmountNgn: number,
    currentTotalNgn: number,
    orgCapitalNgn: number,
    isDedicatedParallex: boolean = false
  ): Promise<DebitWaterfallResult> {
    const newTotal = currentTotalNgn - debitAmountNgn;
    const isBreached = newTotal < orgCapitalNgn;
    const userEquity = Math.max(newTotal - orgCapitalNgn, 0);

    this.logger.log(`Processing Debit for ${accountId}: Amount=₦${debitAmountNgn}, NewTotal=₦${newTotal}, Breached=${isBreached}`);

    let studentStatus = 'ACTIVE';
    let isTimerPaused = false;

    if (isBreached) {
      this.logger.warn(`CAPITAL BREACH ALERT for ${accountId}: Org Capital ₦${orgCapitalNgn} encroached!`);
      studentStatus = 'AT_RISK_CAPITAL_BREACH';
      isTimerPaused = true;

      // Trigger Internal Alert to Core Server
      try {
        const coreServerUrl = process.env.CORE_SERVER_URL || 'http://localhost:3000';
        // In a real scenario, we'd use a robust client or message queue
        fetch(`${coreServerUrl}/api/v1/internal/alerts/breach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: accountId, // Assuming accountId maps to userId here for demo
            requiredFloor: orgCapitalNgn,
            currentBalance: newTotal
          })
        }).catch(err => this.logger.error(`Failed to trigger breach alert: ${err.message}`));
      } catch (error) {
        this.logger.error(`Breach alert dispatch failed: ${error.message}`);
      }
    }

    return {
      totalBalanceNgn: newTotal,
      orgTopUpCapitalNgn: orgCapitalNgn,
      userPersonalEquityNgn: userEquity,
      isCapitalBreached: isBreached,
      studentStatus,
      isTimerPaused
    };
  }

  // Mock persistent storage for demo.
  // In production, this would be a Firestore or Postgres database lookup.
  private lastSyncedMap = new Map<string, number>();

  async processSMSSync(payload: SMSWebhookPayload) {
    this.logger.log(`Processing SMS Ingestion for ${payload.bankName} (${payload.accountMask})`);

    const incomingTimestamp = new Date(payload.timestamp).getTime();
    const currentLastSynced = this.lastSyncedMap.get(payload.accountMask) || 0;

    // Resolve balance updates using timestamp logic
    if (incomingTimestamp <= currentLastSynced) {
      this.logger.warn(`Stale SMS update received for ${payload.accountMask}. Ignoring.`);
      return { status: 'IGNORED', reason: 'STALE_TIMESTAMP' };
    }

    // Commit update
    this.lastSyncedMap.set(payload.accountMask, incomingTimestamp);

    this.logger.log(`Updated Ledger for ${payload.accountMask}: New Balance = ₦${payload.balanceNgn}`);

    return {
      status: 'SUCCESS',
      ingestion_type: 'SMS_INGESTION',
      bankName: payload.bankName,
      accountMask: payload.accountMask,
      newBalance: payload.balanceNgn,
      timestamp: payload.timestamp
    };
  }
