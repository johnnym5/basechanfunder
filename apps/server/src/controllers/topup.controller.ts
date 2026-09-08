import { Controller, Post, Body, HttpCode, HttpStatus, Req, UnauthorizedException, Get } from '@nestjs/common';
import * as admin from 'firebase-admin';

interface TopUpRequestDto {
  userId: string;
  userName: string;
  userEmail: string;
  requestedCapitalNgn: number;
  calculatedFeeNgn: number;
  totalPayableNgn: number;
  reason: string;
  paymentReference: string;
}

@Controller('api/v1/topup')
export class TopUpController {
  private get db() {
    return admin.firestore();
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

      // 1. Record Top-Up Request in Firestore
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

      // 2. Update Root Student Record
      await this.db.collection('users').doc(userId).update({
        topUpStatus: 'REQUEST_PENDING',
        activeTopUpRequestId: requestId,
        updatedAt: new Date().toISOString(),
      });

      // 3. Trigger Admin Notification
      await this.db.collection('notifications').add({
        recipientRole: 'ADMIN',
        targetUserId: userId,
        title: 'Top-Up Request Submitted',
        message: `User submitted a top-up request of ₦${Number(topUpAmountNgn).toLocaleString()} with reference: "${paymentReference}".`,
        type: 'TOPUP_REQUEST',
        requestId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Top-up request submitted successfully',
        requestId,
      };
    } catch (error: any) {
      console.error('Top-up request error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getTopUpStatus() {
    return {
      status: 'OPERATIONAL',
      gateway: 'PARALLEX_DIRECT_SYNC',
      lastPulse: new Date().toISOString()
    };
  }
}
