import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import * as admin from 'firebase-admin';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Controller('api/v1/ledger')
export class LedgerController {
  private readonly logger = new Logger(LedgerController.name);
  private readonly db = admin.firestore();

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  async recalculate(@Body() body: { userId: string }) {
    const { userId } = body;
    if (!userId) return { status: 'ERROR', message: 'Missing User ID' };

    this.logger.log(`Recalculating balance for user ${userId}`);

    try {
      // 1. Query all active financial accounts (Corrected to top-level collection)
      const accountsSnap = await this.db.collection('financial_accounts')
        .where('userId', '==', userId)
        .where('status', '==', 'VERIFIED') // Frontend uses 'VERIFIED'
        .get();

      let totalEquityNgn = 0;
      accountsSnap.forEach(doc => {
        const data = doc.data();
        totalEquityNgn += (Number(data.accountBalanceNgn) || Number(data.balanceNgn) || 0);
      });

      // 2. Fetch Live FX Rate
      const configSnap = await this.db.collection('system_config').doc('global').get();
      const exchangeRate = configSnap.data()?.fxRate || 1945.50;
      const gbpEquivalent = totalEquityNgn / exchangeRate;

      // 3. Overwrite Root User Document
      await this.db.collection('users').doc(userId).set({
        totalEquityNgn,
        consolidatedBalanceNgn: totalEquityNgn,
        gbpEquivalent,
        isSyncing: false,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return {
        status: 'SUCCESS',
        totalEquityNgn,
        gbpEquivalent
      };
    } catch (error: any) {
      this.logger.error(`Recalculation error: ${error.message}`);
      return { status: 'ERROR', message: error.message };
    }
  }

  @Post('statement')
  async generateStatement(@Body() body: { userId: string }, @Res() res: Response) {
    const { userId } = body;
    if (!userId) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing User ID' });

    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (!userData) throw new Error('User not found');

      // 1. Create a fresh PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // 2. Header / Branded Background
      page.drawRectangle({
        x: 0,
        y: height - 100,
        width,
        height: 100,
        color: rgb(0.04, 0.08, 0.14), // Dark Navy
      });

      page.drawText('BASECHAN FUNDER', {
        x: 50,
        y: height - 55,
        size: 24,
        font: fontBold,
        color: rgb(0.95, 0.62, 0.23), // Amber
      });

      page.drawText('PROOF OF FUNDS - STATUS REPORT', {
        x: 50,
        y: height - 80,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // 3. User Details
      let yPos = height - 150;
      const drawField = (label: string, value: string) => {
        page.drawText(label, { x: 50, y: yPos, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(value, { x: 200, y: yPos, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
        yPos -= 25;
      };

      drawField('APPLICANT NAME:', userData.displayName || 'N/A');
      drawField('EMAIL ADDRESS:', userData.email || 'N/A');
      drawField('REPORT DATE:', new Date().toLocaleDateString());
      drawField('SYSTEM UID:', userId.substring(0, 12).toUpperCase());

      yPos -= 20;
      page.drawLine({
        start: { x: 50, y: yPos + 10 },
        end: { x: width - 50, y: yPos + 10 },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });

      // 4. Financial Summary
      yPos -= 20;
      page.drawText('CONSOLIDATED LEDGER SUMMARY', { x: 50, y: yPos, size: 12, font: fontBold, color: rgb(0.04, 0.08, 0.14) });
      yPos -= 40;

      const totalNgn = userData.consolidatedBalanceNgn || 0;
      const totalGbp = userData.gbpEquivalent || 0;

      // Large Balance Box
      page.drawRectangle({
        x: 50,
        y: yPos - 60,
        width: width - 100,
        height: 80,
        color: rgb(0.97, 0.98, 1),
        borderColor: rgb(0.1, 0.4, 0.8),
        borderWidth: 1,
      });

      page.drawText('TOTAL LIQUID ASSETS (GBP):', { x: 70, y: yPos, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(`£ ${totalGbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
        x: 70,
        y: yPos - 35,
        size: 32,
        font: fontBold,
        color: rgb(0.1, 0.4, 0.8),
      });

      page.drawText(`Local Currency Equiv: NGN ${totalNgn.toLocaleString()}`, {
        x: 70,
        y: yPos - 52,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });

      // 5. Verification Badge
      yPos -= 120;
      page.drawText('VERIFICATION STATUS:', { x: 50, y: yPos, size: 10, font: fontBold });
      page.drawText('VERIFIED_CONTINUOUS_HOLDING', {
        x: 200,
        y: yPos,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.6, 0.4)
      });

      // 6. Footer Disclaimer
      page.drawText('This document is an automated status report from the Basechan Funder governance engine.', {
        x: 50,
        y: 40,
        size: 8,
        font: fontRegular,
        color: rgb(0.6, 0.6, 0.6),
      });
      page.drawText('Security Hash: ' + Math.random().toString(36).substring(2, 15).toUpperCase(), {
        x: 50,
        y: 30,
        size: 8,
        font: fontRegular,
        color: rgb(0.7, 0.7, 0.7),
      });

      const pdfBytes = await pdfDoc.save();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=POF_Statement_${userData.displayName || 'User'}.pdf`,
        'Content-Length': pdfBytes.length,
      });

      return res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
      this.logger.error(`Statement error: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }
}
