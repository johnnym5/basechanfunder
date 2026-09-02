import { Injectable, Logger } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import axios from 'axios';

@Injectable()
export class MonoService {
  private readonly logger = new Logger(MonoService.name);
  private readonly monoApiBase = 'https://api.withmono.com';
  private readonly monoSecretKey = process.env.MONO_SECRET_KEY;

  constructor(private readonly ingestionService: IngestionService) {}

  async fetchMonoBalance(monoAccountId: string) {
    this.logger.log(`Fetching live balance for Mono account: ${monoAccountId}`);
    try {
      const response = await axios.get(`${this.monoApiBase}/accounts/${monoAccountId}`, {
        headers: { 'mono-sec-key': this.monoSecretKey }
      });

      const balanceData = response.data.account.balance;
      const currency = response.data.account.currency;

      // Update ledger via ingestion service
      return this.ingestionService.processOpenBankingData({
        account_id: monoAccountId,
        provider: 'MONO',
        balances: [{
          date: new Date().toISOString(),
          amount: balanceData / 100, // Mono returns in kobo
          currency: currency
        }]
      });
    } catch (error) {
      this.logger.error(`Failed to fetch Mono balance: ${error.message}`);
      throw error;
    }
  }

  async handleMonoWebhookEvent(payload: any) {
    this.logger.log(`Received Mono Webhook: ${payload.event}`);

    if (payload.event === 'mono.events.account_updated') {
      const accountId = payload.data.account._id;
      return this.fetchMonoBalance(accountId);
    }

    return { status: 'IGNORED', event: payload.event };
  }
}
