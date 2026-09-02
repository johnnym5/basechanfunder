import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { IngestionService, OpenBankingPayload, StatementUploadPayload, SMSWebhookPayload } from './ingestion.service';
import { MonoService } from './mono.service';

@Controller('api/v1')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly monoService: MonoService
  ) {}

  @Get('health')
  getHealth() {
    return { status: 'healthy', service: 'ingestion-service' };
  }

  @Post('ingestion/open-banking')
  @HttpCode(HttpStatus.OK)
  async ingestOpenBanking(@Body() payload: OpenBankingPayload) {
    return this.ingestionService.processOpenBankingData(payload);
  }

  @Post('ingestion/mono-webhook')
  @HttpCode(HttpStatus.OK)
  async handleMonoWebhook(@Body() payload: any) {
    return this.monoService.handleMonoWebhookEvent(payload);
  }

  @Get('ingestion/mono/sync/:id')
  async syncMonoAccount(@Param('id') id: string) {
    return this.monoService.fetchMonoBalance(id);
  }

  @Post('accounts/sms-sync')
  @HttpCode(HttpStatus.OK)
  async ingestSMSPayload(@Body() payload: SMSWebhookPayload) {
    return this.ingestionService.processSMSSync(payload);
  }

  @Post('ingestion/manual-statement')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestManualStatement(@Body() payload: StatementUploadPayload) {
    return this.ingestionService.processManualStatement(payload);
  }
}
