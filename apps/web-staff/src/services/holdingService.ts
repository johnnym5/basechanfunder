import { db } from '../db/offlineStorage';

export interface PoFResult {
  currentDay: number;
  totalDays: number;
  lowestBalance: number;
  targetAmount: number;
  isCompliant: boolean;
  fxBufferApplied: number;
}

export const calculateOfflineMaturity = async (
  targetGBP: number,
  fxBufferPercent: number = 10
): Promise<PoFResult> => {
  // 1. Fetch last 28 days of balances from IndexedDB
  const history = await db.daily_balances
    .orderBy('snapshot_date')
    .reverse()
    .limit(28)
    .toArray();

  const bufferMultiplier = 1 + (fxBufferPercent / 100);
  const adjustedTarget = targetGBP * bufferMultiplier;

  if (history.length === 0) {
    return {
      currentDay: 0,
      totalDays: 28,
      lowestBalance: 0,
      targetAmount: adjustedTarget,
      isCompliant: false,
      fxBufferApplied: fxBufferPercent
    };
  }

  // 2. Find lowest balance in the period
  let lowestBalance = history[0].converted_balance;
  let compliantDays = 0;

  // Iterate from oldest to newest to find consecutive compliant days
  const sortedHistory = [...history].sort((a, b) =>
    new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );

  for (const day of sortedHistory) {
    if (day.converted_balance < lowestBalance) {
      lowestBalance = day.converted_balance;
    }

    if (day.converted_balance >= adjustedTarget) {
      compliantDays++;
    } else {
      compliantDays = 0; // Reset if broken
    }
  }

  return {
    currentDay: Math.min(compliantDays, 28),
    totalDays: 28,
    lowestBalance,
    targetAmount: adjustedTarget,
    isCompliant: compliantDays >= 28,
    fxBufferApplied: fxBufferPercent
  };
};

export const syncOfflineTransactions = async () => {
  const unsynced = await db.transactions
    .where('synced')
    .equals(0) // Using 0 for false in IndexedDB query
    .toArray();

  for (const tx of unsynced) {
    try {
      // Mock API call
      console.log('Syncing transaction:', tx.dedup_hash);

      // Update local state to synced
      await db.transactions.update(tx.id!, { synced: true });
    } catch (error) {
      console.error('Failed to sync transaction:', tx.dedup_hash, error);
    }
  }
};
