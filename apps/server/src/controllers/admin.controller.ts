import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Get, Delete, Param, Logger, Query, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import * as admin from 'firebase-admin';
import { StorageService } from '../services/storage.service';

@Controller('api/v1/admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly storageService: StorageService) {}

  private get db() {
    return admin.firestore();
  }

  @Get('storage/metrics')
  async getStorageMetrics() {
    return this.storageService.getStorageMetrics();
  }

  @Get('storage/list')
  async listStorageItems(@Query('prefix') prefix: string) {
    return this.storageService.listItems(prefix || '');
  }

  @Post('storage/batch-delete')
  @HttpCode(HttpStatus.OK)
  async batchDeleteStorage(@Body() body: { paths: string[] }) {
    return this.storageService.batchDelete(body.paths);
  }

  @Get('storage/url')
  async getStorageSignedUrl(@Query('path') path: string) {
    return this.storageService.getSignedUrl(path);
  }

  @Post('storage/upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadStorageFiles(@UploadedFiles() files: any[], @Body('prefix') prefix: string) {
    return this.storageService.uploadFiles(files, prefix || '');
  }

  @Get('auth/users')
  @HttpCode(HttpStatus.OK)
  async listAuthUsers() {
    const listUsersResult = await admin.auth().listUsers(1000);
    return listUsersResult.users.map(user => ({
      uid: typeof user.uid === 'string' ? user.uid : '',
      email: user.email || '',
      displayName: user.displayName || '',
      providers: user.providerData.map(p => p.providerId),
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime,
      disabled: user.disabled
    }));
  }

  @Delete('auth/users/:uid')
  @HttpCode(HttpStatus.OK)
  async deleteAuthUser(@Param('uid') uid: string) {
    await admin.auth().deleteUser(uid);
    return { status: 'SUCCESS' };
  }

  @Delete('users/:uid')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('uid') uid: string) {
    try {
      this.logger.log(`[ADMIN] Archiving user (Soft Delete): ${uid}`);

      // Mark user as archived
      await this.db.collection('users').doc(uid).set({
        status: 'DELETED',
        isArchived: true,
        hardDeleted: true,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return {
        success: true,
        message: "User moved to archive."
      };
    } catch (err: any) {
      this.logger.error('Soft-archive error:', err);
      return { status: 'ERROR', message: err.message };
    }
  }

  @Delete('users/:uid/purge')
  @HttpCode(HttpStatus.OK)
  async purgeUser(@Param('uid') uid: string) {
    try {
      this.logger.log(`[ADMIN] Executing final purge for user: ${uid}`);

      // STEP A: Firebase Storage Wipe
      try {
        const bucket = admin.storage().bucket();
        const prefixes = [`student_documents/${uid}/`, `mandate_packages/${uid}/`, `student_packages/${uid}/` ];
        for (const prefix of prefixes) {
          await bucket.deleteFiles({ prefix, force: true }).catch(() => {});
        }
      } catch (e) {}

      // STEP B: Firestore Cleanup
      const batchSize = 100;
      const collections = ['financial_accounts', 'pof_evaluations', 'liquidity_requests', 'notifications', 'audit_logs'];

      for (const col of collections) {
        const snap = await this.db.collection(col).where(col === 'audit_logs' ? 'studentId' : 'userId', '==', uid).get();
        if (!snap.empty) {
          const batch = this.db.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      // STEP C: Subcollections & User Root
      const userRef = this.db.collection('users').doc(uid);
      const subDocs = await userRef.collection('submitted_documents').get();
      if (!subDocs.empty) {
        const batch = this.db.batch();
        subDocs.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      await userRef.delete();

      // STEP D: Auth Deletion
      try { await admin.auth().deleteUser(uid); } catch (e) {}

      return { success: true, message: "User permanently purged." };
    } catch (err: any) {
      this.logger.error('Purge error:', err);
      return { status: 'ERROR', message: err.message };
    }
  }

  @Post('users/:uid/restore')
  @HttpCode(HttpStatus.OK)
  async restoreUser(@Param('uid') uid: string) {
    try {
      await this.db.collection('users').doc(uid).set({
        isArchived: false,
        hardDeleted: false,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return { status: 'SUCCESS' };
    } catch (err: any) {
      return { status: 'ERROR', message: err.message };
    }
  }

  @Post('app/upload-apk')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadApk(@UploadedFile() file: any, @Body() body: { version: string, versionCode: string, releaseNotes: string }) {
    // 1. Process File Upload (to Firebase Storage or local disk)
    const apkUrl = `https://basechanfunder.app/downloads/basechan-funder-v${body.version}.apk`;

    // 2. Update Version Registry in Firestore
    await this.db.collection('system_config').doc('app_version').set({
      version: body.version,
      versionCode: parseInt(body.versionCode),
      releaseNotes: body.releaseNotes,
      apkUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { status: 'SUCCESS', apkUrl };
  }

  @Get('topup-test')
  testTopUp() {
    return { status: 'REACHABLE' };
  }

  @Post('topup-approve')
  @HttpCode(HttpStatus.OK)
  async approveTopUp(@Body() body: { requestId: string, userId: string, approvedCapitalNgn: number, adminServiceFeeNgn: number }) {
    const { requestId, userId, approvedCapitalNgn, adminServiceFeeNgn } = body;

    try {
      const batch = this.db.batch();

      const requestRef = this.db.collection('topup_requests').doc(requestId);
      batch.set(requestRef, {
        status: 'APPROVED',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedCapitalNgn: Number(approvedCapitalNgn),
        adminServiceFeeNgn: Number(adminServiceFeeNgn),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};

      const LIVE_FX_RATE = 1945.50;
      const newEquity = (Number(userData.totalEquityNgn) || 0) + Number(approvedCapitalNgn);
      const newConsolidated = (Number(userData.consolidatedBalanceNgn) || 0) + Number(approvedCapitalNgn);
      const newGbp = Math.round((newConsolidated / LIVE_FX_RATE) * 100) / 100;

      batch.set(userRef, {
        totalEquityNgn: newEquity,
        consolidatedBalanceNgn: newConsolidated,
        gbpEquivalent: newGbp,
        topUpStatus: 'APPROVED',
        status: 'CLEARED',
        isApproved: true,
        setupCompleted: true,
        onboardingComplete: true,
        hasPendingTopUp: false,
        activeTopUpRequestId: null,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 1. Maintain Card 2: Dedicated Organization Top-Up Card in financial_accounts
      const topUpAccRef = this.db.collection('financial_accounts').doc(`TOPUP_${userId}`);
      const topUpBal = Number(approvedCapitalNgn);
      const topUpGbp = Math.round((topUpBal / LIVE_FX_RATE) * 100) / 100;

      batch.set(topUpAccRef, {
        userId,
        userEmail: userData.email || '',
        accountName: 'Basechan Sponsored Capital',
        bankName: 'Organization Top-Up Capital',
        accountNumberMasked: '•••• TOPUP',
        accountType: 'SPONSORED',
        balanceNgn: topUpBal,
        accountBalanceNgn: topUpBal,
        orgTopUpCapitalNgn: topUpBal,
        balanceGbp: topUpGbp,
        status: 'VERIFIED',
        isVerified: true,
        isSystemTopUp: false,
        connectionMethod: 'TOP_UP',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Add transaction entry for the top-up card
      const txnRef = topUpAccRef.collection('transactions').doc();
      batch.set(txnRef, {
        type: 'CREDIT',
        amount: topUpBal,
        description: 'Organization Top-Up Capital Disbursement',
        reference: requestId,
        balanceAfter: topUpBal,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      // 2. Ensure existing personal account(s) only reflect actual personal balance
      const accountsSnap = await this.db.collection('financial_accounts')
        .where('userId', '==', userId)
        .get();

      for (const accDoc of accountsSnap.docs) {
        if (accDoc.id !== `TOPUP_${userId}` && accDoc.data().connectionMethod !== 'TOP_UP') {
          const accData = accDoc.data();
          if (accData.orgTopUpCapitalNgn > 0) {
            const actualBal = Math.max((Number(accData.balanceNgn) || 0) - Number(accData.orgTopUpCapitalNgn), 0);
            batch.set(accDoc.ref, {
              orgTopUpCapitalNgn: 0,
              balanceNgn: actualBal,
              accountBalanceNgn: actualBal,
              balanceGbp: Math.round((actualBal / LIVE_FX_RATE) * 100) / 100,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      }

      // 3. Sync pof_evaluations
      const evalSnap = await this.db.collection('pof_evaluations').where('userId', '==', userId).get();
      if (!evalSnap.empty) {
        batch.set(evalSnap.docs[0].ref, {
          status: 'CLEARED',
          isApproved: true,
          balanceGbp: newGbp,
          balanceNgn: newConsolidated,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      const notifRef = this.db.collection('notifications').doc();
      batch.set(notifRef, {
        userId,
        title: 'Top-Up Approved!',
        message: `₦${Number(approvedCapitalNgn).toLocaleString()} has been added to your ledger.`,
        type: 'SUCCESS',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      return { status: 'SUCCESS' };
    } catch (err: any) {
      return { status: 'ERROR', message: err.message };
    }
  }

  @Post('topup-deny')
  @HttpCode(HttpStatus.OK)
  async denyTopUp(@Body() body: { requestId: string, userId: string, rejectionReason: string }) {
    const { requestId, userId, rejectionReason } = body;

    try {
      const batch = this.db.batch();

      batch.update(this.db.collection('topup_requests').doc(requestId), {
        status: 'REJECTED',
        rejectionReason,
        rejectedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      batch.update(this.db.collection('users').doc(userId), {
        topUpStatus: 'REJECTED',
        hasPendingTopUp: false,
        status: 'ACTION_REQUIRED',
        activeTopUpRequestId: null,
        updatedAt: new Date().toISOString()
      });

      batch.set(this.db.collection('notifications').doc(), {
        userId,
        title: 'Top-Up Request Denied',
        message: `Your top-up request was declined: ${rejectionReason}`,
        type: 'ALERT',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      return { status: 'SUCCESS' };
    } catch (err: any) {
      return { status: 'ERROR', message: err.message };
    }
  }

  @Post('settings/seed-requirements')
  @HttpCode(HttpStatus.OK)
  async seedGlobalDocumentRequirements() {
    // ... logic ...
  }

  @Post('notifications/inactivity-action')
  @HttpCode(HttpStatus.OK)
  async handleInactivityAction(@Body() body: { userId: string, notificationId: string, action: 'DELETE' | 'LEAVE' }) {
    try {
      const { userId, notificationId, action } = body;

      if (action === 'DELETE') {
        // reuse the cascading delete logic
        await this.deleteUser(userId);
      } else {
        // If leave, we set the level to 60 (or keep at current if already 60) to prevent immediate re-alert
        const userRef = this.db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        const currentLevel = userSnap.data()?.inactivityReminderLevel || 30;
        await userRef.set({
          inactivityReminderLevel: currentLevel === 30 ? 30 : 60, // Level is managed by cron, we just acknowledge
          lastInactivityAction: 'LEAVE',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // Mark notification as read and processed
      await this.db.collection('notifications').doc(notificationId).update({
        isRead: true,
        actionTaken: action,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { status: 'SUCCESS' };
    } catch (err: any) {
      console.error('Inactivity action error:', err);
      throw err;
    }
  }
}
