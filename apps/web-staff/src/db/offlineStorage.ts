import Dexie, { type EntityTable } from 'dexie';

export interface DailyBalance {
  id?: number;
  snapshot_date: string; // ISO 8601
  ngn_balance: number;
  converted_balance: number; // GBP
  is_compliant: boolean;
}

export interface Transaction {
  id?: number;
  dedup_hash: string; // Unique hash for idempotency
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  timestamp: string;
  synced: boolean;
}

export interface QueuedRequest {
  id?: number;
  request_payload: any;
  created_at: string;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
}

class BasechanDatabase extends Dexie {
  daily_balances!: EntityTable<DailyBalance, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  queued_requests!: EntityTable<QueuedRequest, 'id'>;

  constructor() {
    super('BasechanOfflineDB');
    this.version(1).stores({
      daily_balances: '++id, snapshot_date, is_compliant',
      transactions: '++id, dedup_hash, timestamp, synced',
      queued_requests: '++id, created_at, sync_status'
    });
  }
}

export const db = new BasechanDatabase();
