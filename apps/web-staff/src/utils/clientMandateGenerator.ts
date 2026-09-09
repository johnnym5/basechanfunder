import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';

export interface MandateData {
  userId?: string;
  accountName: string;
  accountNumber?: string;
  mandateAuthorisation: string;
  bvn: string;
  surname: string;
  firstName: string;
  otherName?: string;
  identificationType: string;
  identificationNo: string;
  telephoneNo: string;
  date: string;
  passportPhotoBase64?: string;
}

export const stampMandateTemplate = async (templateUrl: string, data: MandateData): Promise<Uint8Array> => {
  const response = await fetch(templateUrl);
  const templateBuffer = await response.arrayBuffer();

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

  // --- PASSPORT PHOTOGRAPH ---
  if (data.passportPhotoBase64) {
    try {
      const base64Data = data.passportPhotoBase64.includes('base64,')
        ? data.passportPhotoBase64.split('base64,')[1]
        : data.passportPhotoBase64;

      const photoBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const image = await pdfDoc.embedJpg(photoBytes).catch(() => pdfDoc.embedPng(photoBytes));

      page.drawImage(image, {
        x: 435,
        y: 50,
        width: 110,
        height: 130
      });
    } catch (e) {
      console.warn('Passport embedding failed:', e);
    }
  }

  return await pdfDoc.save();
};

export const generateMandateOverlayClientSide = async (data: MandateData): Promise<string> => {
  if (!data.userId) throw new Error('User ID required');

  const templateUrl = '/templates/Upgrade_Form.pdf';
  const pdfBytes = await stampMandateTemplate(templateUrl, data);

  const storageRef = ref(storage, `student_documents/${data.userId}/drafts/Upgrade_Form_Overlay.pdf`);
  await uploadBytes(storageRef, pdfBytes, { contentType: 'application/pdf' });
  return await getDownloadURL(storageRef);
};
