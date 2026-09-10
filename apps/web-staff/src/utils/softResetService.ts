import {
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  listAll,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase';

const COLLECTIONS_TO_WIPE = [
  'users',
  'financial_accounts',
  'pof_evaluations',
  'audit_logs',
  'liquidity_requests',
  'support_messages',
  'support_tickets',
  'notifications',
  'manual_adjustments',
  'system_config',
  'system'
];

/**
 * Per-User Soft Reset
 * Clears evaluation and transaction history for a specific student without deleting the user account.
 */
export const executeSoftReset = async (userId: string) => {
  const batch = writeBatch(db);

  // Clear evaluation
  batch.delete(doc(db, 'pof_evaluations', userId));

  // Clear top-up request
  batch.delete(doc(db, 'financial_accounts', `TOPUP_${userId}`));

  // Reset user status
  batch.update(doc(db, 'users', userId), {
    status: 'NEW',
    isApproved: false,
    onboardingComplete: false,
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};

/**
 * High-Level Database & Storage Purge Engine
 * WARNING: This will permanently erase all records from Firestore and Storage.
 */
export const nukeEntireEnvironment = async (onProgress?: (msg: string) => void) => {
  try {
    // 1. Wipe Firestore Collections
    for (const colName of COLLECTIONS_TO_WIPE) {
      if (onProgress) onProgress(`Clearing collection: ${colName}...`);

      try {
        const snap = await getDocs(collection(db, colName));
        if (snap.empty) continue;

        const chunks = [];
        const batchSize = 400; // Reduced for safety

        for (let i = 0; i < snap.docs.length; i += batchSize) {
          chunks.push(snap.docs.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (colErr: any) {
        console.warn(`[Nuke] Failed to clear collection ${colName}:`, colErr.message);
      }
    }

    // 2. Wipe Cloud Storage
    try {
      if (onProgress) onProgress('Clearing Cloud Storage bucket...');
      await deleteFolderRecursive('');
    } catch (storageErr: any) {
      console.warn('[Nuke] Storage wipe failed or partially completed:', storageErr.message);
    }

    if (onProgress) onProgress('Environment Reset Successful.');
    return { success: true };
  } catch (error: any) {
    console.error('Nuke operation failed:', error);
    throw error;
  }
};

/**
 * Helper to recursively delete all files in the bucket
 */
async function deleteFolderRecursive(path: string) {
  const storageRef = ref(storage, path);
  const list = await listAll(storageRef);

  // Delete all files in current folder
  await Promise.all(list.items.map(file => deleteObject(file)));

  // Recurse into subfolders
  await Promise.all(list.prefixes.map(prefix => deleteFolderRecursive(prefix.fullPath)));
}
