import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as admin from 'firebase-admin';

export interface CompilationPayload {
  userId: string;
  supportingDocs: {
    id: string;
    base64: string;
    fileType: string;
  }[];
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

    /**
     * Required Sequence:
     * 1. signed_upgrade_form
     * 2. passport_photo
     * 3. id_data_page
     * 4. utility_bill
     * 5. nin_doc
     * 6. bvn_doc
     */
    const sequence = [
      'signed_upgrade_form',
      'passport_photo',
      'id_data_page',
      'utility_bill',
      'nin_doc',
      'bvn_doc'
    ];

    for (const docId of sequence) {
      const docData = payload.supportingDocs.find(d => d.id === docId);
      if (!docData) {
        this.logger.warn(`Missing document ${docId} for compilation. Skipping.`);
        continue;
      }

      try {
        const docBytes = Buffer.from(docData.base64.split(',')[1] || docData.base64, 'base64');

        if (docData.fileType === 'application/pdf' || docData.base64.includes('application/pdf')) {
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
        this.logger.warn(`Failed to append supporting doc ${docId}: ${e.message}`);
      }
    }

    const finalPdfBytes = await masterPdf.save();
    const fileName = `Parallex_Upgrade_Package_${payload.userId}.pdf`;
    const destination = `student_packages/${payload.userId}/${fileName}`;

    // 3. Upload to Firebase Storage
    const file = this.bucket.file(destination);
    await file.save(Buffer.from(finalPdfBytes), {
      metadata: { contentType: 'application/pdf' },
    });

    // Generate signed URL (valid for 24 hours)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    // 4. Update Student Status in Firestore
    await admin.firestore().collection('users').doc(payload.userId).update({
      mandateStatus: 'MANDATE_SUBMITTED_AWAITING_APPROVAL',
      compiledPackageUrl: destination,
      compiledPackageDownloadUrl: signedUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    this.logger.log(`Master PDF package submitted for user ${payload.userId}`);
    return { success: true, url: signedUrl };
  }
}
