import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { IngestionService, OpenBankingPayload, StatementUploadPayload, SMSWebhookPayload } from './ingestion.service';

@Controller('api/v1/ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Get('health')
  getHealth() {
    return { status: 'healthy', service: 'ingestion-service' };
  }

  @Post('open-banking')
  @HttpCode(HttpStatus.OK)
  async ingestOpenBanking(@Body() payload: OpenBankingPayload) {
    return this.ingestionService.processOpenBankingData(payload);
  }

  @Post('manual-statement')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestManualStatement(@Body() payload: StatementUploadPayload) {
    return this.ingestionService.processManualStatement(payload);
  }

  @Post('sms-webhook')
  @HttpCode(HttpStatus.OK)
  async ingestSMSWebhook(@Body() payload: SMSWebhookPayload) {
    return this.ingestionService.processSMSWebhook(payload);
  }
}
