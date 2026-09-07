import { Controller, Post, Body, Res, HttpStatus, Param } from '@nestjs/common';
import { Response } from 'express';
import { PdfStampingService, MandateData } from '../services/pdfStampingService';
import { PdfCompilerService, CompilationPayload } from '../services/pdfCompilerService';
import { MandateSyncService } from '../services/mandateSync.service';

@Controller('api/v1/mandate')
export class MandateController {
  constructor(
    private readonly pdfStampingService: PdfStampingService,
    private readonly pdfCompilerService: PdfCompilerService,
    private readonly mandateSyncService: MandateSyncService,
  ) {}

  @Post('generate-draft')
  async generateDraft(@Body() data: MandateData, @Res() res: Response) {
    try {
      const pdfBuffer = await this.pdfStampingService.generateDraft(data);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Mandate_Draft_${data.surname}.pdf`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
    }
  }

  @Post('submit-package')
  async submitPackage(@Body() payload: CompilationPayload) {
    return this.pdfCompilerService.compileAndSubmit(payload);
  }

  @Post('sync-profile/:userId')
  async syncProfile(@Param('userId') userId: string) {
    return this.mandateSyncService.syncMandateToProfile(userId);
  }
}
