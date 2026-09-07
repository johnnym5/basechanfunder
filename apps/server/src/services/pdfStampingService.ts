import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export interface MandateData {
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
  passportPhotoBase64: string; // From Stage 2
}

@Injectable()
export class PdfStampingService {
  private readonly logger = new Logger(PdfStampingService.name);

  async generateDraft(data: MandateData): Promise<Buffer> {
    this.logger.log(`Generating mandate draft for ${data.surname} ${data.firstName}`);

    // 1. Load the base template
    const templatePath = path.resolve(__dirname, '../../../assets', 'Parallex_Account_Mandate_Template.pdf');
    const fallbackPath = path.resolve(process.cwd(), 'assets', 'Parallex_Account_Mandate_Template.pdf');
    const rootPath = path.resolve(process.cwd(), 'apps/server/assets', 'Parallex_Account_Mandate_Template.pdf');

    let finalPath = templatePath;
    if (!fs.existsSync(finalPath)) finalPath = fallbackPath;
    if (!fs.existsSync(finalPath)) finalPath = rootPath;

    if (!fs.existsSync(finalPath)) {
      this.logger.error(`Template not found. Checked: ${templatePath}, ${fallbackPath}, ${rootPath}`);
      throw new Error('Mandate template file missing (Parallex_Account_Mandate_Template.pdf)');
    }

    const existingPdfBytes = fs.readFileSync(finalPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];

    // 2. Overlay Text (Coordinates are estimates, usually tuned per template)
    const drawText = (text: string, x: number, y: number, size = 10) => {
      if (text) {
        page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
      }
    };

    // Account Details
    drawText(data.accountName, 150, 680);
    drawText(data.accountNumber || '', 150, 660);

    // Personal Details
    drawText(data.surname, 150, 600);
    drawText(data.firstName, 150, 580);
    drawText(data.otherName || '', 150, 560);
    drawText(data.bvn, 150, 540);
    drawText(data.telephoneNo, 150, 520);
    drawText(data.identificationType.replace(/_/g, ' '), 150, 500);
    drawText(data.identificationNo, 150, 480);
    drawText(data.date, 150, 460);

    // 3. Handle Mandate Authorisation Checkboxes
    const checkX = {
      SOLE_SIGNATORY: 100,
      EITHER_TO_SIGN: 200,
      BOTH_TO_SIGN: 300,
    };
    const yAuthorisation = 635;
    const authorisatnX = checkX[data.mandateAuthorisation] || checkX.SOLE_SIGNATORY;
    page.drawText('X', { x: authorisatnX, y: yAuthorisation, size: 12, font });

    // 4. Affix Passport Photo
    try {
      if (data.passportPhotoBase64 && data.passportPhotoBase64.length > 100) {
        const base64Data = data.passportPhotoBase64.includes('base64,')
          ? data.passportPhotoBase64.split('base64,')[1]
          : data.passportPhotoBase64;

        const photoBytes = Buffer.from(base64Data, 'base64');
        const image = await pdfDoc.embedJpg(photoBytes).catch(() => pdfDoc.embedPng(photoBytes));

        // Frame coordinates: usually top right of the form
        const frameX = 450;
        const frameY = 580;
        const frameWidth = 100;
        const frameHeight = 120;

        page.drawImage(image, {
          x: frameX,
          y: frameY,
          width: frameWidth,
          height: frameHeight,
        });
      } else {
        this.logger.warn('Passport photo base64 is missing or too short.');
      }
    } catch (e) {
      this.logger.warn(`Failed to affix passport photo: ${e.message}`);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
