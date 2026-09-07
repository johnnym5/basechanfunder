import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as admin from 'firebase-admin';

export interface CompilationPayload {
  userId: string;
  signedMandateBase64: string; // The wet-signed Page 1
  supportingDocs: string[]; // Base64 or GCS paths for the 5 docs
}

@Injectable()
export class PdfCompilerService {
  private readonly logger = new Logger(PdfCompilerService.name);

  private get bucket() {
    return admin.storage().bucket();
  }

  async compileAndSubmit(payload: CompilationPayload) {
    this.logger.log(`Compiling master PDF package for user ${payload.userId}`);

    const masterPdf = await PDFDocument.create();

    // 1. Add the signed mandate page
    try {
      const signedBytes = Buffer.from(payload.signedMandateBase64.split(',')[1] || payload.signedMandateBase64, 'base64');
      const signedPdf = await PDFDocument.load(signedBytes);
      const [signedPage] = await masterPdf.copyPages(signedPdf, [0]);
      masterPdf.addPage(signedPage);
    } catch (e) {
      this.logger.error(`Failed to process signed mandate: ${e.message}`);
      throw new Error('Invalid signed mandate file');
    }

    // 2. Append the 5 supporting documents
    for (const docBase64 of payload.supportingDocs) {
      try {
        const docBytes = Buffer.from(docBase64.split(',')[1] || docBase64, 'base64');

        // Check if it's an image or a PDF
        if (docBase64.includes('application/pdf') || !docBase64.includes('image')) {
            const externalPdf = await PDFDocument.load(docBytes);
            const copiedPages = await masterPdf.copyPages(externalPdf, externalPdf.getPageIndices());
            copiedPages.forEach((page) => masterPdf.addPage(page));
        } else {
            // It's an image, create a new PDF page and embed it
            const page = masterPdf.addPage();
            const { width, height } = page.getSize();
            const image = await masterPdf.embedJpg(docBytes).catch(() => masterPdf.embedPng(docBytes));

            // Scale to fit page
            const dims = image.scaleToFit(width - 40, height - 40);
            page.drawImage(image, {
                x: 20,
                y: height - dims.height - 20,
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
