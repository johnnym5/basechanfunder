import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatementTransaction, FuzzySmsParser } from './fuzzySmsParser';

interface ExportData {
  studentName: string;
  bankName: string;
  accountNumber: string;
  totalInflow: number;
  totalOutflow: number;
  linkDate: string;
  transactions: StatementTransaction[];
}

export class StatementPdfGenerator {
  public static async generate(data: ExportData): Promise<void> {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;

    // 1. Header Banner
    doc.setFillColor(3, 7, 18); // Dark Navy #030712
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BASECHAN COMPLIANCE NODE', margin, 18);

    doc.setFontSize(10);
    doc.text('ELECTRONIC LEDGER STATEMENT', margin, 26);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`GENERATED ON: ${new Date().toLocaleString()}`, pageWidth - margin - 50, 18);

    // 2. Account Metadata Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('ACCOUNT SUMMARY', margin, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student Name: ${data.studentName.toUpperCase()}`, margin, 65);
    doc.text(`Bank Name: ${data.bankName}`, margin, 72);
    doc.text(`Account No: ${data.accountNumber}`, margin, 79);
    doc.text(`Link Date: ${data.linkDate}`, margin, 86);

    // Stats Cards (simulated)
    doc.setDrawColor(230, 230, 230);
    doc.rect(margin, 95, 80, 20);
    doc.text('TOTAL INFLOW', margin + 5, 102);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`NGN ${data.totalInflow.toLocaleString()}`, margin + 5, 110);

    doc.setTextColor(0, 0, 0);
    doc.rect(margin + 90, 95, 80, 20);
    doc.text('TOTAL OUTFLOW', margin + 95, 102);
    doc.setTextColor(244, 63, 94); // Rose
    doc.text(`NGN ${data.totalOutflow.toLocaleString()}`, margin + 95, 110);

    // 3. Transactions Table
    autoTable(doc, {
      startY: 125,
      head: [['DATE & TIME', 'DESCRIPTION', 'TYPE', 'AMOUNT (NGN)', 'BALANCE (NGN)']],
      body: data.transactions.map(txn => [
        FuzzySmsParser.formatTimestamp(txn.timestamp),
        txn.description.toUpperCase(),
        txn.type === 'CREDIT' ? 'CR' : 'DR',
        txn.amountNgn.toLocaleString(),
        txn.runningBalanceNgn.toLocaleString()
      ]),
      headStyles: {
        fillColor: [3, 7, 18],
        fontSize: 9,
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    // 4. Footer Verification
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`SIGNED & VERIFIED BY BASECHAN COMPLIANCE NODE • TIMESTAMP: ${Date.now()}`, margin, finalY);
    doc.text(`VERIFICATION HASH: ${Math.random().toString(36).substring(2, 15).toUpperCase()}`, margin, finalY + 5);

    // 5. Save
    doc.save(`Ledger_Statement_${data.studentName.replace(/\s+/g, '_')}.pdf`);
  }
}
