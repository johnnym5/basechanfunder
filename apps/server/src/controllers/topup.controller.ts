import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

@Controller('api/v1/topup')
export class TopUpController {
  private get db() {
    return getFirestore(admin.app(), 'basechanfunder');
  }

  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestTopUp(@Body() body: any) {
    try {
      const { userId, topUpAmountNgn, serviceFeeNgn, paymentReference, accountNumber } = body;

      if (!userId || !topUpAmountNgn || !paymentReference) {
        return { success: false, error: 'Missing required top-up request fields' };
      }

      const requestId = `TOPUP_${Date.now()}`;
      const userRef = this.db.collection('users').doc(userId);

      // 1. Record Top-Up Request
      await this.db.collection('topup_requests').doc(requestId).set({
        requestId,
        userId,
        topUpAmountNgn: Number(topUpAmountNgn),
        serviceFeeNgn: Number(serviceFeeNgn),
        paymentReference,
        accountNumber: accountNumber || '',
        status: 'PENDING_ADMIN_VERIFICATION',
        createdAt: new Date().toISOString(),
      });

      // 2. Safely Update Root User Record
      await userRef.set({
        status: 'TOPUP_PENDING',
        topUpStatus: 'REQUEST_PENDING',
        hasPendingTopUp: true,
        activeTopUpRequestId: requestId,
        lastTopUpRequestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 3. Trigger Admin Notification
      await this.db.collection('notifications').add({
        recipientRole: 'ADMIN',
        targetUserId: userId,
        title: 'Top-Up Request Submitted',
        message: `User submitted a top-up request of ₦${Number(topUpAmountNgn).toLocaleString()}.`,
        type: 'TOPUP_REQUEST',
        requestId,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: 'Top-up request recorded successfully', requestId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getTopUpStatus() {
    return { status: 'OPERATIONAL', lastPulse: new Date().toISOString() };
  }

  @Post('approve')
  @HttpCode(HttpStatus.OK)
  async approveTopUp(@Body() body: { requestId: string, userId: string, approvedCapitalNgn: number, adminServiceFeeNgn: number }) {
    const { requestId, userId, approvedCapitalNgn, adminServiceFeeNgn } = body;
    try {
      if (!requestId || !userId) {
        return { status: 'ERROR', message: 'Missing required requestId or userId' };
      }

      const batch = this.db.batch();
      batch.set(this.db.collection('topup_requests').doc(requestId), {
        status: 'APPROVED',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedCapitalNgn: Number(approvedCapitalNgn),
        adminServiceFeeNgn: Number(adminServiceFeeNgn),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};

      const newEquity = (Number(userData.totalEquityNgn) || 0) + Number(approvedCapitalNgn);
      const newConsolidated = (Number(userData.consolidatedBalanceNgn) || 0) + Number(approvedCapitalNgn);

      batch.set(userRef, {
        totalEquityNgn: newEquity,
        consolidatedBalanceNgn: newConsolidated,
        topUpStatus: 'APPROVED',
        status: 'CLEARED',
        isApproved: true,
        setupCompleted: true,
        onboardingComplete: true,
        hasPendingTopUp: false,
        activeTopUpRequestId: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Sync pof_evaluations
      const evalSnap = await this.db.collection('pof_evaluations').where('userId', '==', userId).get();
      if (!evalSnap.empty) {
        batch.set(evalSnap.docs[0].ref, {
          status: 'CLEARED',
          isApproved: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        const newEvalRef = this.db.collection('pof_evaluations').doc();
        batch.set(newEvalRef, {
          userId,
          name: userData.displayName || userData.username || 'Student',
          email: userData.email || '',
          status: 'CLEARED',
          isApproved: true,
          balanceGbp: userData.balanceGbp || 0,
          targetGbp: userData.targetGbp || 0,
          anomalyRatio: 0,
          consecutiveDays: 28,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
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

  @Post('deny')
  @HttpCode(HttpStatus.OK)
  async denyTopUp(@Body() body: { requestId: string, userId: string, rejectionReason: string }) {
    const { requestId, userId, rejectionReason } = body;
    try {
      if (!requestId || !userId) {
        return { status: 'ERROR', message: 'Missing required requestId or userId' };
      }

      const batch = this.db.batch();
      batch.set(this.db.collection('topup_requests').doc(requestId), {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Information mismatch',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      batch.set(this.db.collection('users').doc(userId), {
        topUpStatus: 'REJECTED',
        hasPendingTopUp: false,
        status: 'ACTION_REQUIRED',
        activeTopUpRequestId: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      batch.set(this.db.collection('notifications').doc(), {
        userId,
        title: 'Top-Up Request Denied',
        message: `Your top-up request was declined: ${rejectionReason || 'Information mismatch'}`,
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
}
