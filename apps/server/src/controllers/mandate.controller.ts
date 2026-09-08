import { Controller, Post, Get, Body, Res, HttpStatus, Param } from '@nestjs/common';
import { Response } from 'express';
import * as admin from 'firebase-admin';
import { PdfStampingService, MandateData } from '../services/pdfStampingService';
import { PdfCompilerService, CompilationPayload } from '../services/pdfCompilerService';
import { MandateSyncService } from '../services/mandateSync.service';
import { TemplateService } from '../services/templateService';

@Controller('api/v1/mandate')
export class MandateController {
  constructor(
    private readonly pdfStampingService: PdfStampingService,
    private readonly pdfCompilerService: PdfCompilerService,
    private readonly mandateSyncService: MandateSyncService,
    private readonly templateService: TemplateService,
  ) {}

  @Get('template/upgrade-form')
  async getUpgradeFormTemplate(@Res() res: Response) {
    try {
      const buffer = await this.templateService.getUpgradeForm();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Upgrade_Form_Blank.pdf"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Length', buffer.length.toString());
      return res.send(buffer);
    } catch (e) {
      return res.status(HttpStatus.NOT_FOUND).json({ error: e.message });
    }
  }

  @Post('compile-package')
  async compilePackage(@Body() payload: CompilationPayload) {
    return this.pdfCompilerService.compileAndSubmit(payload);
  }

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

  @Post('generate-overlay')
  async generateOverlay(@Body() data: MandateData, @Res() res: Response) {
    try {
      const result = await this.pdfStampingService.generateOverlay(data);

      // ─── Production Grade Headers for PDF Streaming & Preview ───
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // If cloud upload succeeded, return the JSON with URL
      if (result.url) {
        return res.status(HttpStatus.OK).json({ status: 'SUCCESS', downloadUrl: result.url });
      }

      // If cloud upload failed (limbo mode), stream the PDF directly back to browser
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Upgrade_Form_${data.surname || 'Mandate'}.pdf"`);
      return res.send(result.buffer);

    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: 'ERROR', message: e.message });
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

  @Post('draft/:userId')
  async getDraft(@Param('userId') userId: string, @Body() data: MandateData, @Res() res: Response) {
    // This is essentially the same as generate-overlay but mapped to the requested route
    return this.generateOverlay({ ...data, userId }, res);
  }

  @Get('draft/:userId')
  async getDraftPreview(@Param('userId') userId: string, @Res() res: Response) {
    try {
      // For GET preview, we assume the PDF was already generated and exists in Storage
      // OR we just return a message saying POST is required for generation
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/pdf');

      const bucket = admin.storage().bucket();
      const draftPath = `student_documents/${userId}/drafts/Upgrade_Form_Overlay.pdf`;
      const draftFile = bucket.file(draftPath);

      const [exists] = await draftFile.exists();
      if (!exists) {
        return res.status(HttpStatus.NOT_FOUND).send('Draft not found. Please generate it first.');
      }

      const [buffer] = await draftFile.download();
      res.setHeader('Content-Disposition', 'inline; filename="Upgrade_Form_Overlay.pdf"');
      return res.send(buffer);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(e.message);
    }
  }
}
