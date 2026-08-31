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
  sender: string;
  message_body: string;
  timestamp: string;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  async processOpenBankingData(payload: OpenBankingPayload) {
    this.logger.log(`Ingesting Open Banking data for Account: ${payload.account_id}`);
    // Future integration: Publish event to Redpanda / Kafka event stream
    return {
      status: 'SUCCESS',
      ingestion_type: 'OPEN_BANKING',
      processed_records: payload.balances?.length || 0,
      timestamp: new Date().toISOString(),
    };
  }

  async processManualStatement(payload: StatementUploadPayload) {
    this.logger.log(`Processing Manual Bank Statement for User: ${payload.user_id}`);
    return {
      status: 'QUEUED_FOR_OCR',
      ingestion_type: 'MANUAL_STATEMENT',
      file_name: payload.file_name,
      timestamp: new Date().toISOString(),
    };
  }

  async processSMSWebhook(payload: SMSWebhookPayload) {
    this.logger.log(`Parsing financial SMS from: ${payload.sender}`);
    return {
      status: 'PARSED',
      ingestion_type: 'SMS_WEBHOOK',
      sender: payload.sender,
      timestamp: new Date().toISOString(),
    };
  }
}
