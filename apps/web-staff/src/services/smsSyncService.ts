import {
  db
} from '../firebase';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { StatementTransaction } from './fuzzySmsParser';

export class SmsSyncService {
  /**
   * Syncs an array of parsed transactions to Firestore.
   * Updates aggregated totals in the parent account document.
   */
  public static async syncTransactions(
    userId: string,
    accountId: string,
    transactions: StatementTransaction[]
  ): Promise<void> {
    if (!userId || !accountId || transactions.length === 0) return;

    const batch = writeBatch(db);
    const accountRef = doc(db, 'financial_accounts', accountId);

    // 1. Calculate Aggregates
    let totalInflow = 0;
    let totalOutflow = 0;

    transactions.forEach(txn => {
      if (notInFuture(txn.timestamp)) {
        if (txn.type === 'CREDIT') totalInflow += txn.amountNgn;
        if (txn.type === 'DEBIT') totalOutflow += txn.amountNgn;
      }
    });

    // 2. Save Transactions to Subcollection
    const txnsRef = collection(db, 'financial_accounts', accountId, 'transactions');
    transactions.forEach(txn => {
      const txnRef = doc(txnsRef, txn.id);
      batch.set(txnRef, {
        ...txn,
        syncedAt: serverTimestamp()
      }, { merge: true });
    });

    // 3. Update Parent Account Document
    const accountSnap = await getDoc(accountRef);
    const accountData = accountSnap.data() || {};

    const updates: any = {
      totalInflowNgn: totalInflow,
      totalOutflowNgn: totalOutflow,
      updatedAt: serverTimestamp()
    };

    // Fix Invalid Date bug: set linkDate if not present
    if (!accountData.linkDate) {
      updates.linkDate = transactions[transactions.length - 1].timestamp; // Use oldest in batch
    }

    batch.update(accountRef, updates);

    await batch.commit();
  }
}

function notInFuture(isoString: string): boolean {
  const d = new Date(isoString);
  return d.getTime() <= Date.now() + 60000; // Allow 1 min clock drift
}
