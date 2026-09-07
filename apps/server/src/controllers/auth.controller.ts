import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Get } from '@nestjs/common';
import * as admin from 'firebase-admin';

export const PRE_APPROVED_COUNSELORS = [
  { name: "Peter", email: "peter.basechaninternational@gmail.com" },
  { name: "Feridu", email: "feridu.basechaninternational@gmail.com" },
  { name: "Effiong", email: "effiong.basechaninternational@gmail.com" },
  { name: "Cletus", email: "cletus.basechaninternational@gmail.com" },
  { name: "Izunyon", email: "izunyon.basechaninternational@gmail.com" },
  { name: "Jumai", email: "jumaibasechaninternational@gmail.com" },
  { name: "Nwaiwu Blessing OGE", email: "nwaiwu.basechaninternational@gmail.com" },
];

@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  @Get('health')
  healthCheck() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }

  @Post('sync-claims')
  @HttpCode(HttpStatus.OK)
  async syncClaims(@Body() body: { uid: string, email: string }) {
    const { uid, email } = body;

    if (!uid) {
      return { status: 'ERROR', message: 'Missing UID' };
    }

    const lowerEmail = (email || '').toLowerCase().trim();

    // 1. Determine Role
    let role = 'STUDENT';
    const isWhitelisted = PRE_APPROVED_COUNSELORS.some(c => c.email.toLowerCase() === lowerEmail);

    if (isWhitelisted) {
      role = 'COUNSELOR';
    } else if (lowerEmail.endsWith('@basechaninternational.com')) {
      role = 'ADMIN_GOVERNANCE';
    } else if (lowerEmail.includes('auditor')) {
      role = 'STAFF_AUDITOR';
    }

    try {
      this.logger.log(`Syncing claims for UID: ${uid}, Email: ${email} -> Role: ${role}`);

      // 2. Set Custom User Claims (Optional / Best Effort)
      // This requires high-level Admin SDK permissions. If it fails (e.g. invalid_rapt),
      // we log it but don't kill the request because Firestore is our primary backup.
      try {
        await admin.auth().setCustomUserClaims(uid, { role });
        this.logger.log(`✅ Custom claims synced for ${uid}`);
      } catch (authErr: any) {
        this.logger.warn(`⚠️ Auth Claims sync skipped: ${authErr.message}. This is normal if you don't have an Admin Key.`);
      }

      // 3. Update Firestore profile (This is our main source of truth for the UI)
      await admin.firestore().collection('users').doc(uid).set({
        email,
        role,
        isApproved: role !== 'STUDENT',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return {
        status: 'SUCCESS',
        role,
        message: 'Profile updated in Firestore. Custom claims may be delayed.'
      };
    } catch (error: any) {
      this.logger.error(`❌ Critical error updating user ${uid}: ${error.message}`);
      return { status: 'ERROR', message: error.message };
    }
  }
}
