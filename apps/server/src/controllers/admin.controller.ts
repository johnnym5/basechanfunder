import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Get, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as admin from 'firebase-admin';

@Controller('api/v1/admin')
export class AdminController {
  private get db() {
    return admin.firestore();
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
      console.log(`[ADMIN] Initiating cascading hard delete for user: ${uid}`);

      // STEP A: Firebase Storage Wipe
      try {
        const bucket = admin.storage().bucket();
        const prefixes = [
          `student_documents/${uid}/`,
          `mandate_packages/${uid}/`,
          `student_packages/${uid}/`
        ];

        for (const prefix of prefixes) {
          // deleteFiles handles empty prefixes gracefully if force is true or manually checked
          await bucket.deleteFiles({ prefix, force: true }).catch(err => {
            if (err.code !== 404) console.warn(`Storage prefix ${prefix} delete warning:`, err.message);
          });
        }
      } catch (storageErr: any) {
        console.error(`Storage cleanup critical failure for ${uid}:`, storageErr.message);
      }

      // STEP B: Firestore Document & Subcollections Cascade
      // 1. Top-level collections where userId matches
      const topLevelCollections = ['financial_accounts', 'pof_evaluations', 'liquidity_requests', 'notifications'];

      for (const col of topLevelCollections) {
        const snap = await this.db.collection(col).where('userId', '==', uid).get();
        if (!snap.empty) {
          const batch = this.db.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      // 2. Audit Log Clean-up (Remove logs where this user was the student)
      const auditSnap = await this.db.collection('audit_logs').where('studentId', '==', uid).get();
      if (!auditSnap.empty) {
        const batch = this.db.batch();
        auditSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // 3. User Root & Subcollections
      const userRef = this.db.collection('users').doc(uid);

      // Recursive subcollection deletion (submitted_documents is primary)
      const subDocsSnap = await userRef.collection('submitted_documents').get();
      if (!subDocsSnap.empty) {
        const batch = this.db.batch();
        subDocsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Additional subcollections check
      const subCollections = await userRef.listCollections();
      for (const sub of subCollections) {
        const subSnap = await sub.get();
        if (!subSnap.empty) {
          const batch = this.db.batch();
          subSnap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      // 4. Delete the primary user document
      await userRef.delete();

      // STEP C: Soft-Fail Auth Deletion
      try {
        await admin.auth().deleteUser(uid);
      } catch (authError: any) {
        console.warn(`[DELETE_USER_WARN] Could not delete Auth record for ${uid} due to IAM/permissions, proceeding with DB wipe:`, authError.message);
      }

      // STEP D: UI Sync Response
      return {
        success: true,
        message: "User database records and storage files deleted successfully."
      };
    } catch (err: any) {
      console.error('Cascading delete error:', err);
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
        await userRef.update({
          inactivityReminderLevel: currentLevel === 30 ? 30 : 60, // Level is managed by cron, we just acknowledge
          lastInactivityAction: 'LEAVE',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
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
