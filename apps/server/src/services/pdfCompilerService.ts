import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { MandateData, PdfStampingService } from './pdfStampingService';

export interface CompilationPayload {
  userId: string;
  signedMandateBase64?: string; // Optional: The wet-signed Page 1 scan
  mandateData: MandateData;      // Data to stamp a fresh Page 1 if needed
  supportingDocs: string[];      // Base64 or GCS paths for the docs
}

@Injectable()
export class PdfCompilerService {
  private readonly logger = new Logger(PdfCompilerService.name);

  constructor(private readonly pdfStampingService: PdfStampingService) {}

  private get bucket() {
    return admin.storage().bucket();
  }

  async compileAndSubmit(payload: CompilationPayload) {
    this.logger.log(`Compiling master PDF package for user ${payload.userId}`);

    const masterPdf = await PDFDocument.create();

    // 1. Generate/Add Page 1 (Form Overlay)
    try {
      if (payload.signedMandateBase64) {
        this.logger.log('Using wet-signed mandate as Page 1');
        const signedBytes = Buffer.from(payload.signedMandateBase64.split(',')[1] || payload.signedMandateBase64, 'base64');
        const signedPdf = await PDFDocument.load(signedBytes);
        const copiedPages = await masterPdf.copyPages(signedPdf, [0]);
        masterPdf.addPage(copiedPages[0]);
      } else {
        this.logger.log('Generating fresh digitally stamped mandate as Page 1');
        // We need to fetch the template buffer
        const localAssetPath = path.resolve(process.cwd(), 'apps/server/assets/Upgrade_Form.pdf');
        if (!fs.existsSync(localAssetPath)) throw new Error('Master template missing in assets folder');
        const templateBuffer = fs.readFileSync(localAssetPath);

        const stampedBuffer = await this.pdfStampingService.stampTemplate(templateBuffer, payload.mandateData);
        const stampedPdf = await PDFDocument.load(stampedBuffer);
        const copiedPages = await masterPdf.copyPages(stampedPdf, [0]);
        masterPdf.addPage(copiedPages[0]);
      }
    } catch (e) {
      this.logger.error(`Failed to process Page 1: ${e.message}`);
      throw new Error('Invalid Page 1 (Mandate Form)');
    }

    // 2. Append Supporting Documents in Exact Sequence
    // Required Order: 1. Passport Data Page, 2. Utility Bill, 3. NIN, 4. BVN
    for (const docBase64 of payload.supportingDocs) {
      if (!docBase64) continue;

      try {
        const docBytes = Buffer.from(docBase64.split(',')[1] || docBase64, 'base64');

        // Check if it's an image or a PDF
        if (docBase64.includes('application/pdf') || !docBase64.includes('image')) {
            const externalPdf = await PDFDocument.load(docBytes);
            const copiedPages = await masterPdf.copyPages(externalPdf, externalPdf.getPageIndices());
            copiedPages.forEach((page) => masterPdf.addPage(page));
        } else {
            // It's an image, create a new A4 PDF page and embed it
            const page = masterPdf.addPage([595.28, 841.89]); // A4 Size
            const { width, height } = page.getSize();
            const image = await masterPdf.embedJpg(docBytes).catch(() => masterPdf.embedPng(docBytes));

            // Scale to fit page with margins
            const dims = image.scaleToFit(width - 80, height - 80);
            page.drawImage(image, {
                x: (width - dims.width) / 2,
                y: (height - dims.height) / 2,
                width: dims.width,
                height: dims.height,
            });
        }
      } catch (e) {
        this.logger.warn(`Failed to append supporting doc: ${e.message}`);
      }
    }

    const finalPdfBytes = await masterPdf.save();
    const fileName = `Parallex_Mandate_Package_${payload.userId}.pdf`;
    const destination = `mandate_packages/${payload.userId}/${fileName}`;

    // 3. Upload to Firebase Storage
    const file = this.bucket.file(destination);
    await file.save(Buffer.from(finalPdfBytes), {
      metadata: { contentType: 'application/pdf' },
    });

    // 4. Update Student Status in Firestore
    await admin.firestore().collection('users').doc(payload.userId).update({
      mandateStatus: 'MANDATE_SUBMITTED_AWAITING_APPROVAL',
      mandatePackageUrl: destination,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    this.logger.log(`Master PDF package submitted for user ${payload.userId}`);
    return { success: true, url: destination };
  }
}
