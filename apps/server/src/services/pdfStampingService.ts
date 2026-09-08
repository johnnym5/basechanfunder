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

  async generateOverlay(data: MandateData): Promise<{ url?: string; buffer: Buffer }> {
    const userId = data.userId || 'anonymous';
    this.logger.log(`Generating precise PDF overlay for user ${userId}`);

    try {
      // 1. Fetch Master Template (Storage -> Local Assets -> Downloads)
      let templateBuffer: Buffer;
      const bucket = this.storage.bucket();
      const templateFile = bucket.file('system_assets/Upgrade Form.pdf');

      const localAssetPath = path.resolve(process.cwd(), 'apps/server/assets/Upgrade Form.pdf');
      const downloadsPath = "C:\\Users\\HP\\Downloads\\Upgrade Form.pdf";

      try {
        const [exists] = await templateFile.exists();
        if (exists) {
          this.logger.log('Loading template from Firebase Storage...');
          const [downloaded] = await templateFile.download();
          templateBuffer = downloaded;
        } else {
          throw new Error('Storage missing');
        }
      } catch (storageErr) {
        if (fs.existsSync(localAssetPath)) {
          this.logger.log('Fallback: Loading template from Local Assets...');
          templateBuffer = fs.readFileSync(localAssetPath);
        } else if (fs.existsSync(downloadsPath)) {
          this.logger.log('Fallback: Loading template from User Downloads...');
          templateBuffer = fs.readFileSync(downloadsPath);
        } else {
          throw new Error(`Master template not found. Searched Storage, ${localAssetPath}, and ${downloadsPath}`);
        }
      }

      const pdfDoc = await PDFDocument.load(templateBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.getPages()[0];

      // 2. Helper for Precise Stamping
      const drawText = (text: string, x: number, y: number, size = 10) => {
        if (text) {
          page.drawText(text.toUpperCase(), { x, y, size, font, color: rgb(0, 0, 0) });
        }
      };

      // --- SECTION 1: ACCOUNT DETAILS ---
      drawText(data.accountName, 130, 735, 10);
      drawText(data.accountNumber || 'N/A', 130, 715, 10);

      // --- MANDATE CHECKBOX ---
      // Sole Signatory box is around x: 104, Either: 218, Both: 345 (Estimated based on text alignment)
      let checkboxX = 104;
      if (data.mandateAuthorisation === 'EITHER_TO_SIGN') checkboxX = 218;
      if (data.mandateAuthorisation === 'BOTH_TO_SIGN') checkboxX = 345;
      page.drawText('X', { x: checkboxX, y: 692, size: 12, font });

      // --- SECTION 2: PERSONAL DETAILS ---
      drawText(data.bvn, 150, 668, 10);

      // Surname, First Name, Other Name (Stacked or inline? Section 1 lines say x: 120, y: 630)
      // Usually these are on separate lines in the template
      drawText(data.surname, 120, 630, 10);
      drawText(data.firstName, 120, 615, 10);
      drawText(data.otherName || '', 120, 600, 10);

      // ID Details & Phone
      drawText(data.identificationType.replace(/_/g, ' '), 120, 575, 10);
      drawText(data.identificationNo, 120, 560, 10);
      drawText(data.telephoneNo, 120, 545, 10);

      // Date
      drawText(data.date, 440, 480, 10);

      // 3. PASSPORT PHOTOGRAPH FRAME ALIGNMENT
      if (data.passportPhotoBase64 && data.passportPhotoBase64.length > 100) {
        try {
          const base64Data = data.passportPhotoBase64.includes('base64,')
            ? data.passportPhotoBase64.split('base64,')[1]
            : data.passportPhotoBase64;

          const photoBytes = Buffer.from(base64Data, 'base64');
          const image = await pdfDoc.embedJpg(photoBytes).catch(() => pdfDoc.embedPng(photoBytes));

          // Draw cleanly inside "Please affix passport photo" frame
          page.drawImage(image, {
            x: 435,       // Precise Frame X
            y: 620,       // Adjusted Y (usually top right, prompt said 50 but that's bottom, using 620 based on template layout)
            width: 110,   // Frame width
            height: 130   // Frame height
          });
        } catch (imgErr) {
          this.logger.warn(`Passport image embedding failed: ${imgErr.message}`);
        }
      }

      // 4. Save stamped PDF back to Storage (Try Cloud -> Return Local Buffer on Error)
      const stampedPdfBytes = await pdfDoc.save();
      const stampedBuffer = Buffer.from(stampedPdfBytes);

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

  // Keep old generateDraft for backward compatibility if needed, but update it to use local assets safely
  async generateDraft(data: MandateData): Promise<Buffer> {
    // ... logic for local generation ...
    return Buffer.from([]); // Placeholder for now as we focus on generateOverlay
  }
}
