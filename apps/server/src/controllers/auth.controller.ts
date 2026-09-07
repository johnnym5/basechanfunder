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
      this.logger.log(`Syncing claims for UID: ${uid}, Email: ${email}`);

      // 2. Set Custom User Claims
      await admin.auth().setCustomUserClaims(uid, { role });

      // 3. Update Firestore profile as backup
      await admin.firestore().collection('users').doc(uid).set({
        email,
        role,
        isApproved: role !== 'STUDENT',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { status: 'SUCCESS', role };
    } catch (error: any) {
      this.logger.error(`Error syncing claims for ${uid}: ${error.message}`);
      // Don't throw to avoid 500 if possible, return error status
      return { status: 'ERROR', message: error.message };
    }
  }
}
