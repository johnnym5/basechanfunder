import { Controller, Post, Body, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
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
  private readonly db = admin.firestore();

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async requestTopUp(@Body() body: TopUpRequestDto) {
    try {
      // 1. Create a request record in Firestore
      const requestRef = await this.db.collection('liquidity_requests').add({
        ...body,
        status: 'PENDING_PAYMENT_VERIFICATION',
        type: 'TOP_UP',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Update student's evaluation status
      const evalSnap = await this.db.collection('pof_evaluations')
        .where('userId', '==', body.userId)
        .limit(1)
        .get();

      if (!evalSnap.empty) {
        const evalDoc = evalSnap.docs[0];
        await evalDoc.ref.update({
          status: 'NEEDS_TOPUP',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 3. Create a system notification for admins
      await this.db.collection('admin_notifications').add({
        title: 'New Top-Up Request',
        body: `${body.userName} has requested a top-up of ₦${body.requestedCapitalNgn.toLocaleString()}.`,
        userId: body.userId,
        requestId: requestRef.id,
        type: 'TOP_UP_PENDING',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        status: 'SUCCESS',
        requestId: requestRef.id,
        message: 'Top-up request submitted for verification.'
      };
    } catch (error: any) {
      console.error('Top-up request error:', error);
      return {
        status: 'ERROR',
        message: 'Failed to process top-up request: ' + error.message
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
