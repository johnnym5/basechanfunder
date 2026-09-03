import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as admin from 'firebase-admin';

@Injectable()
export class PurgeService {
  private readonly logger = new Logger(PurgeService.name);
  private readonly db = admin.firestore();

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handlePurge() {
    this.logger.log('Starting automated 7-day hard-purge engine...');
    const now = admin.firestore.Timestamp.now();

    try {
      const expiredUsersSnap = await this.db.collection('users')
        .where('status', '==', 'ARCHIVED')
        .where('permanentDeleteAt', '<=', now)
        .get();

      if (expiredUsersSnap.empty) {
        this.logger.log('No expired archived users found.');
        return;
      }

      this.logger.log(`Found ${expiredUsersSnap.size} expired users. Initiating purge...`);

      for (const userDoc of expiredUsersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();

        // 1. Delete from sub-ledgers
        const collections = ['financial_accounts', 'pof_evaluations', 'liquidity_requests', 'support_messages', 'notifications'];
        for (const col of collections) {
          const snap = await this.db.collection(col).where('userId', '==', uid).get();
          const batch = this.db.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }

        // 2. Delete Auth User
        try {
          await admin.auth().deleteUser(uid);
        } catch (authErr: any) {
          if (authErr.code !== 'auth/user-not-found') {
            this.logger.error(`Failed to delete auth user ${uid}: ${authErr.message}`);
          }
        }

        // 3. Delete User Document
        await userDoc.ref.delete();

        // 4. Record Audit Log
        await this.db.collection('audit_logs').add({
          action: 'HARD_PURGE_AUTOMATED',
          detail: `Permanently purged expired user ${userData.email || uid} after 7-day archival period.`,
          actor: 'System Purge Engine',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        this.logger.log(`User ${uid} purged successfully.`);
      }
    } catch (err: any) {
      this.logger.error(`Purge engine error: ${err.message}`);
    }
  }
}
