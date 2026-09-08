import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export interface MandateData {
  userId?: string;
  accountName: string;
  accountNumber?: string;
  mandateAuthorisation: 'SOLE_SIGNATORY' | 'EITHER_TO_SIGN' | 'BOTH_TO_SIGN';
  bvn: string;
  surname: string;
  firstName: string;
  otherName?: string;
  classOfSignatory?: string;
  identificationType: string;
  identificationNo: string;
  telephoneNo: string;
  date: string;
  passportPhotoBase64?: string; // From Stage 2 (Base64)
}

@Injectable()
export class PdfStampingService {
  private readonly logger = new Logger(PdfStampingService.name);
  private readonly storage = admin.storage();

  /**
   * Stacks text and passport overlays onto a template buffer.
   * Logic shared between preview and final compilation.
   */
  public async stampTemplate(templateBuffer: Buffer, data: MandateData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(templateBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];

    const drawText = (text: string, x: number, y: number, size = 10) => {
      if (text) {
        page.drawText(text.toUpperCase(), { x, y, size, font, color: rgb(0, 0, 0) });
      }
    };

    // --- SECTION 1: ACCOUNT DETAILS ---
    drawText(data.accountName, 130, 735, 10);
    drawText(data.accountNumber || 'N/A', 130, 715, 10);

    // --- MANDATE CHECKBOX ---
    let checkboxX = 104;
    if (data.mandateAuthorisation === 'EITHER_TO_SIGN') checkboxX = 218;
    if (data.mandateAuthorisation === 'BOTH_TO_SIGN') checkboxX = 345;
    page.drawText('X', { x: checkboxX, y: 692, size: 12, font });

    // --- SECTION 2: PERSONAL DETAILS ---
    drawText(data.bvn, 150, 668, 10);
    drawText(data.surname, 120, 630, 10);
    drawText(data.firstName, 120, 615, 10);
    drawText(data.otherName || '', 120, 600, 10);

    // ID Details & Phone
    drawText(data.identificationType.replace(/_/g, ' '), 120, 575, 10);
    drawText(data.identificationNo, 120, 560, 10);
    drawText(data.telephoneNo, 120, 545, 10);

    // Date
    drawText(data.date, 440, 480, 10);

    // --- PASSPORT PHOTOGRAPH FRAME ALIGNMENT ---
    if (data.passportPhotoBase64 && data.passportPhotoBase64.length > 100) {
      try {
        const base64Data = data.passportPhotoBase64.includes('base64,')
          ? data.passportPhotoBase64.split('base64,')[1]
          : data.passportPhotoBase64;

        const photoBytes = Buffer.from(base64Data, 'base64');
        const image = await pdfDoc.embedJpg(photoBytes).catch(() => pdfDoc.embedPng(photoBytes));

        page.drawImage(image, {
          x: 435,
          y: 50, // Requirement specific: y: 50
          width: 110,
          height: 130
        });
      } catch (imgErr) {
        this.logger.warn(`Passport image embedding failed: ${imgErr.message}`);
      }
    }

    const stampedPdfBytes = await pdfDoc.save();
    return Buffer.from(stampedPdfBytes);
  }

  async generateOverlay(data: MandateData): Promise<{ url?: string; buffer: Buffer }> {
    const userId = data.userId || 'anonymous';
    this.logger.log(`Generating precise PDF overlay for user ${userId}`);

    try {
      // 1. Fetch Master Template (Storage -> Local Assets -> Downloads)
      let templateBuffer: Buffer;

      const localAssetPath = path.resolve(process.cwd(), 'apps/server/assets/Upgrade_Form.pdf');
      const downloadsPath = "C:\\Users\\HP\\Downloads\\Upgrade Form.pdf";

      try {
        const bucket = this.storage.bucket();
        const templateFile = bucket.file('system_assets/Upgrade Form.pdf');
        const [exists] = await templateFile.exists();

        if (exists) {
          this.logger.log('Loading template from Firebase Storage...');
          const [downloaded] = await templateFile.download();
          templateBuffer = downloaded;
        } else {
          throw new Error('Cloud Storage template missing');
        }
      } catch (storageErr) {
        this.logger.warn(`Cloud fetch failed (${storageErr.message}). Checking local fallbacks...`);

        if (fs.existsSync(localAssetPath)) {
          this.logger.log(`Fallback: Loading from ${localAssetPath}`);
          templateBuffer = fs.readFileSync(localAssetPath);
        } else if (fs.existsSync(downloadsPath)) {
          this.logger.log(`Fallback: Loading from ${downloadsPath}`);
          templateBuffer = fs.readFileSync(downloadsPath);
        } else {
          throw new Error(`Master template not found. Searched Cloud, ${localAssetPath}, and ${downloadsPath}`);
        }
      }

      // 2. Stamp Template
      const stampedBuffer = await this.stampTemplate(templateBuffer, data);

      // 3. Save stamped PDF back to Storage (Try Cloud -> Return Local Buffer on Error)
      const bucket = this.storage.bucket();
      const targetPath = `student_documents/${userId}/drafts/Upgrade_Form_Overlay.pdf`;
      const targetFile = bucket.file(targetPath);

      try {
        this.logger.log('Uploading generated overlay to Firebase Storage...');
        await targetFile.save(stampedBuffer, {
          contentType: 'application/pdf',
          metadata: { cacheControl: 'no-cache' }
        });

        const [url] = await targetFile.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000,
        });

        return { url, buffer: stampedBuffer };
      } catch (uploadErr) {
        this.logger.warn(`Cloud upload failed: ${uploadErr.message}. Returning local buffer.`);
        return { buffer: stampedBuffer };
      }

    } catch (error: any) {
      this.logger.error(`Overlay generation failed: ${error.message}`);
      throw error;
    }
  }

  // Keep old generateDraft for backward compatibility
  async generateDraft(data: MandateData): Promise<Buffer> {
    const localAssetPath = path.resolve(process.cwd(), 'apps/server/assets/Upgrade_Form.pdf');
    if (!fs.existsSync(localAssetPath)) throw new Error('Local template missing: Upgrade_Form.pdf');
    const buffer = fs.readFileSync(localAssetPath);
    return this.stampTemplate(buffer, data);
  }
}
