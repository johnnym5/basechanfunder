import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Post('sync-claims')
  @HttpCode(HttpStatus.OK)
  async syncClaims(@Body() body: { uid: string, email: string }) {
    const { uid, email } = body;
    const lowerEmail = email.toLowerCase().trim();

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

    // 2. Set Custom User Claims
    await admin.auth().setCustomUserClaims(uid, { role });

    // 3. Update Firestore profile as backup
    await admin.firestore().collection('users').doc(uid).set({
      role,
      isApproved: role !== 'STUDENT',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { status: 'SUCCESS', role };
  }
}
