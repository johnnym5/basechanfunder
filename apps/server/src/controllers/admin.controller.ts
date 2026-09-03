import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Get, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

@Controller('api/v1/admin')
export class AdminController {
  private readonly db = admin.firestore();

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

  @Post('users/archive')
  @HttpCode(HttpStatus.OK)
  async archiveUser(@Body() body: { uid: string, evaluationId: string }) {
    try {
      const { uid, evaluationId } = body;
      const now = admin.firestore.Timestamp.now();
      const sevenDaysLater = admin.firestore.Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);

      const userRef = this.db.collection('users').doc(uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        // If user doc doesn't exist, we might be trying to archive a student who only has an evaluation but no user profile yet?
        // Or the doc ID is not the UID.
        // Let's check for any student doc with this userId.
        console.warn(`User doc ${uid} not found. Creating placeholder for archival.`);
        await userRef.set({
          uid,
          status: 'ARCHIVED',
          archivedAt: now,
          permanentDeleteAt: sevenDaysLater,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        // 1. Update status in users collection
        await userRef.update({
          status: 'ARCHIVED',
          archivedAt: now,
          permanentDeleteAt: sevenDaysLater,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 2. Disable user in Firebase Auth
      try {
        await admin.auth().updateUser(uid, { disabled: true });
        await admin.auth().revokeRefreshTokens(uid);
      } catch (authErr: any) {
        console.warn(`Firebase Auth update failed for ${uid}:`, authErr.message);
      }

      return { status: 'SUCCESS', permanentDeleteAt: sevenDaysLater.toDate().toISOString() };
    } catch (err: any) {
      console.error('Archive controller error:', err);
      throw err;
    }
  }

  @Post('users/restore')
  @HttpCode(HttpStatus.OK)
  async restoreUser(@Body() body: { uid: string }) {
    try {
      const { uid } = body;

      // 1. Restore status in users collection
      await this.db.collection('users').doc(uid).update({
        status: 'ACTIVE', // Or determine previous status if needed
        archivedAt: admin.firestore.FieldValue.delete(),
        permanentDeleteAt: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Re-enable user in Firebase Auth
      try {
        await admin.auth().updateUser(uid, { disabled: false });
      } catch (authErr: any) {
        console.warn(`Firebase Auth restoration failed for ${uid}:`, authErr.message);
      }

      return { status: 'SUCCESS' };
    } catch (err: any) {
      console.error('Restore controller error:', err);
      throw err;
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
}
