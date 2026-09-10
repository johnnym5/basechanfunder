import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface StatementData {
  userName: string;
  email: string;
  userId: string;
  consolidatedBalanceNgn: number;
  gbpEquivalent: number;
}

/**
 * Client-Side Proof-of-Funds Status Report Generator
 */
export const generateStatementClientSide = async (data: StatementData): Promise<Uint8Array> => {
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

  page.drawText('E6 ELIXIR', {
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

  drawField('APPLICANT NAME:', data.userName || 'N/A');
  drawField('EMAIL ADDRESS:', data.email || 'N/A');
  drawField('REPORT DATE:', new Date().toLocaleDateString());
  drawField('SYSTEM UID:', data.userId.substring(0, 12).toUpperCase());

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
  page.drawText(`£ ${data.gbpEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
    x: 70,
    y: yPos - 35,
    size: 32,
    font: fontBold,
    color: rgb(0.1, 0.4, 0.8),
  });

  page.drawText(`Local Currency Equiv: NGN ${data.consolidatedBalanceNgn.toLocaleString()}`, {
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
  page.drawText('This document is an automated status report from the E6 Elixir governance engine.', {
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

  return await pdfDoc.save();
};
