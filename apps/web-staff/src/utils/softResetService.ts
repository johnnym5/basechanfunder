import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  listAll,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * Executes a client-side Soft Reset.
 * Wipes Firestore data and Storage files for a user without deleting their Auth account.
 */
export const executeSoftReset = async (targetUid: string): Promise<{ success: boolean; freedBytes: number }> => {
  let totalFreedBytes = 0;

  try {
    // --- 1. Wipe Firebase Storage Assets ---
    const storagePaths = [
      `student_documents/${targetUid}`,
      `student_packages/${targetUid}`,
      `mandate_packages/${targetUid}`
    ];

    for (const folder of storagePaths) {
      const folderRef = ref(storage, folder);
      try {
        const res = await listAll(folderRef);
        await Promise.all(res.items.map(async (fileRef) => {
          // Get metadata to track freed space (optional)
          // const meta = await getMetadata(fileRef);
          // totalFreedBytes += meta.size || 0;
          return deleteObject(fileRef);
        }));

        // Recursively handle sub-folders if any (simplified for now)
        for (const subfolder of res.prefixes) {
            const subRes = await listAll(subfolder);
            await Promise.all(subRes.items.map(item => deleteObject(item)));
        }
      } catch (e) {
        console.warn(`Storage folder ${folder} skip or empty:`, e);
      }
    }

    // --- 2. Cascade Delete Firestore Records ---
    const batch = writeBatch(db);

    // a. Root User Doc
    batch.delete(doc(db, 'users', targetUid));

    // b. Evaluation Node
    // We search for it because the ID might not match targetUid in all cases
    const evalSnap = await getDocs(query(collection(db, 'pof_evaluations'), where('userId', '==', targetUid)));
    evalSnap.forEach(d => batch.delete(d.ref));

    // c. Top-Up Requests
    const topupSnap = await getDocs(query(collection(db, 'topup_requests'), where('userId', '==', targetUid)));
    topupSnap.forEach(d => batch.delete(d.ref));

    // d. Financial Accounts (Linked via userId)
    const accountsSnap = await getDocs(query(collection(db, 'financial_accounts'), where('userId', '==', targetUid)));
    accountsSnap.forEach(d => batch.delete(d.ref));

    // e. Audit Logs
    const logsSnap = await getDocs(query(collection(db, 'audit_logs'), where('studentId', '==', targetUid)));
    logsSnap.forEach(d => batch.delete(d.ref));

    // f. Notifications
    const notifSnap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', targetUid)));
    notifSnap.forEach(d => batch.delete(d.ref));

    // g. Chats / Messages (If applicable)
    const chatsSnap = await getDocs(query(collection(db, 'support_messages'), where('studentId', '==', targetUid)));
    chatsSnap.forEach(d => batch.delete(d.ref));

    // h. Update System Metrics
    if (totalFreedBytes > 0) {
      batch.update(doc(db, 'system', 'storage_metrics'), {
        totalBytesUsed: increment(-totalFreedBytes)
      });
    }

    // Commit all deletions
    await batch.commit();

    return { success: true, freedBytes: totalFreedBytes };
  } catch (error: any) {
    console.error('Soft Reset Engine Failure:', error);
    throw new Error(error.message || 'Cascading deletion failed');
  }
};
