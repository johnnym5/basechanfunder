import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as admin from 'firebase-admin';

@Injectable()
export class PurgeService {
  private readonly logger = new Logger(PurgeService.name);

  private get db() {
    return admin.firestore();
  }

  /**
   * Automated Inactivity Monitoring Engine
   * Runs daily to detect users offline for 30+ days.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async monitorInactivity() {
    this.logger.log('Scanning for inactive users (30+ days)...');

    const now = Date.now();
    const thirtyDaysAgo = admin.firestore.Timestamp.fromMillis(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = admin.firestore.Timestamp.fromMillis(now - 60 * 24 * 60 * 60 * 1000);

    try {
      // 1. Check for 30-day inactivity (Level 1)
      const inactive30Snap = await this.db.collection('users')
        .where('role', '==', 'STUDENT')
        .where('lastActiveAt', '<', thirtyDaysAgo)
        .where('inactivityReminderLevel', '==', 0)
        .get();

      for (const userDoc of inactive30Snap.docs) {
        const userData = userDoc.data();
        if (!userData.lastActiveAt) continue;

        await this.dispatchAdminInactivityAlert(userDoc.id, userData.displayName || userData.email, 30);
        await userDoc.ref.update({
            inactivityReminderLevel: 30,
            lastInactivityAlertAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 2. Check for 60-day inactivity (Level 2)
      const inactive60Snap = await this.db.collection('users')
        .where('role', '==', 'STUDENT')
        .where('lastActiveAt', '<', sixtyDaysAgo)
        .where('inactivityReminderLevel', '==', 30)
        .get();

      for (const userDoc of inactive60Snap.docs) {
        const userData = userDoc.data();
        await this.dispatchAdminInactivityAlert(userDoc.id, userData.displayName || userData.email, 60);
        await userDoc.ref.update({
            inactivityReminderLevel: 60,
            lastInactivityAlertAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

    } catch (err: any) {
      this.logger.error(`Inactivity monitor error: ${err.message}`);
    }
  }

  private async dispatchAdminInactivityAlert(userId: string, userName: string, days: number) {
    const alert = {
      type: 'INACTIVITY_ALERT',
      studentName: userName,
      userId: userId,
      message: `${userName} has been offline for ${days}+ days. Would you like to Delete or Leave?`,
      daysInactive: days,
      requiresAction: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false
    };

    await this.db.collection('notifications').add(alert);
    this.logger.log(`Dispatched ${days}-day inactivity alert for ${userName}`);
  }

  /**
   * Automated Support Conversation Purge (24 Hour Window)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleSupportPurge() {
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const expiredMsgsSnap = await this.db.collection('support_messages')
        .where('createdAt', '<', twentyFourHoursAgo)
        .limit(500)
        .get();

      if (expiredMsgsSnap.empty) return;

      const batch = this.db.batch();
      expiredMsgsSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      this.logger.log(`Purged ${expiredMsgsSnap.size} expired support messages.`);
    } catch (err: any) {
      this.logger.error(`Support purge error: ${err.message}`);
    }
  }

  /**
   * Automated 7-Day Archival Purge
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleArchivalPurge() {
    const now = admin.firestore.Timestamp.now();
    try {
      const expiredUsersSnap = await this.db.collection('users')
        .where('status', '==', 'ARCHIVED')
        .where('permanentDeleteAt', '<=', now)
        .limit(50)
        .get();

      for (const userDoc of expiredUsersSnap.docs) {
        await this.cascadingDelete(userDoc.id);
      }
    } catch (err: any) {
      this.logger.error(`Archival purge error: ${err.message}`);
    }
  }

  private async cascadingDelete(uid: string) {
    const collections = ['financial_accounts', 'pof_evaluations', 'liquidity_requests', 'notifications', 'audit_logs'];
    for (const col of collections) {
      const snap = await this.db.collection(col).where(col === 'audit_logs' ? 'studentId' : 'userId', '==', uid).get();
      const batch = this.db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    const subDocs = await this.db.collection('users').doc(uid).collection('submitted_documents').get();
    const subBatch = this.db.batch();
    subDocs.docs.forEach(d => subBatch.delete(d.ref));
    await subBatch.commit();
    await this.db.collection('users').doc(uid).delete();
  }
}
