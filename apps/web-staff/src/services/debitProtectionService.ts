import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export class DebitProtectionService {
  private static activeListeners: Record<string, () => void> = {};

  /**
   * Monitors a specific account's transactions for debits.
   * Enforces low-equity warnings if balance drops below threshold.
   */
  public static monitorAccount(userId: string, accountId: string, currentBalance: number, studentName: string) {
    const listenerKey = `${userId}_${accountId}`;
    if (this.activeListeners[listenerKey]) return;

    const q = query(
      collection(db, 'financial_accounts', accountId, 'transactions'),
      where('type', '==', 'DEBIT'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) return;

      const latestDebit = snap.docs[0].data();
      const debitTime = latestDebit.timestamp?.seconds ? latestDebit.timestamp.seconds * 1000 : Date.now();

      // Only process recent debits (within last 1 minute) to avoid triggering on old data
      if (Date.now() - debitTime > 60000) return;

      if (currentBalance <= 5000) {
        this.triggerLowEquityAlert(userId, studentName, currentBalance);
      }
    });

    this.activeListeners[listenerKey] = unsubscribe;
  }

  private static async triggerLowEquityAlert(userId: string, studentName: string, balance: number) {
    // 1. Show UI Toast to student
    toast.warning('⚠️ Low Personal Equity Warning', {
      description: `Your personal account balance (₦${balance.toLocaleString()}) is running low. Please replenish to maintain compliance.`,
      duration: 10000
    });

    // 2. Log system notification for Admin Roster indicator
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        studentName,
        title: 'LOW_EQUITY_WARNING',
        message: `Student personal equity dropped to ₦${balance.toLocaleString()} after a debit.`,
        type: 'ALERT',
        isRead: false,
        createdAt: serverTimestamp()
      });

      // 3. Update Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        studentId: userId,
        action: 'LOW_EQUITY_FLAG',
        detail: `System automatically flagged student for low funds (₦${balance.toLocaleString()})`,
        actor: 'Governance Engine',
        createdAt: serverTimestamp()
      });

      // 4. Update Student Evaluation Status
      const evalQ = query(collection(db, 'pof_evaluations'), where('userId', '==', userId));
      const evalSnap = await getDocs(evalQ);
      if (!evalSnap.empty) {
        await updateDoc(evalSnap.docs[0].ref, {
          status: 'AT_RISK',
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error('Failed to log low equity alert:', e);
    }
  }

  public static cleanup(userId: string) {
    Object.keys(this.activeListeners).forEach(key => {
      if (key.startsWith(`${userId}_`)) {
        this.activeListeners[key]();
        delete this.activeListeners[key];
      }
    });
  }
}
