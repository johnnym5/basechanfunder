import { PDFDocument } from 'pdf-lib';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, increment, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

export interface CompilationFile {
  id: string;
  value: string; // Data URL or Download URL
  fileType: string;
  fileName: string;
}

const updateMetrics = async (bytesChange: number) => {
  const metricsRef = doc(db, 'system', 'storage_metrics');
  try {
    await updateDoc(metricsRef, {
      totalBytesUsed: increment(bytesChange)
    });
  } catch (e) {
    await setDoc(metricsRef, { totalBytesUsed: Math.max(0, bytesChange) }, { merge: true });
  }
};

export const compileStudentPackageClientSide = async (userId: string, files: CompilationFile[]): Promise<string> => {
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
    const docData = files.find(f => f.id === docId);
    if (!docData) continue;

    try {
      const response = await fetch(docData.value);
      const docBytes = await response.arrayBuffer();

      if (docData.fileType === 'application/pdf') {
        const externalPdf = await PDFDocument.load(docBytes);
        const copiedPages = await masterPdf.copyPages(externalPdf, externalPdf.getPageIndices());
        copiedPages.forEach((page) => masterPdf.addPage(page));
      } else {
        // It's an image, create a new A4 PDF page and embed it
        const page = masterPdf.addPage([595.28, 841.89]); // A4 Size
        const { width, height } = page.getSize();

        let image;
        if (docData.fileType === 'image/png') {
          image = await masterPdf.embedPng(docBytes);
        } else {
          image = await masterPdf.embedJpg(docBytes);
        }

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
      console.warn(`Failed to append supporting doc ${docId}:`, e);
    }
  }

  const finalPdfBytes = await masterPdf.save();
  const fileName = `Parallex_Upgrade_Package_${userId}.pdf`;
  const destination = `student_packages/${userId}/${fileName}`;

  // 3. Upload to Firebase Storage
  const storageRef = ref(storage, destination);
  await uploadBytes(storageRef, finalPdfBytes, { contentType: 'application/pdf' });
  const downloadUrl = await getDownloadURL(storageRef);

  // Update Metrics
  await updateMetrics(finalPdfBytes.length);

  // 4. Update Student Status in Firestore
  await updateDoc(doc(db, 'users', userId), {
    mandateStatus: 'MANDATE_SUBMITTED_AWAITING_APPROVAL',
    compiledPackageUrl: destination,
    compiledPackageDownloadUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  });

  return downloadUrl;
};
