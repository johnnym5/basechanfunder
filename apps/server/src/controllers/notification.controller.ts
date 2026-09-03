import { Controller, Post, Body, HttpCode, HttpStatus, Get, Logger } from '@nestjs/common';
import { NotificationService } from '../services/notificationService';
import { EmailService } from '../services/emailService';
import * as admin from 'firebase-admin';

@Controller('api/v1')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService
  ) {}

  @Get('app/latest-version')
  async getLatestVersion() {
    const snap = await admin.firestore().collection('system_config').doc('app_version').get();
    return snap.exists ? snap.data() : { versionCode: 0, version: '0.0.0' };
  }

  @Post('notifications/register-device')
  @HttpCode(HttpStatus.OK)
  async registerDevice(
    @Body() body: { userId: string; deviceToken: string; platform: 'ANDROID' | 'IOS' | 'WEB' }
  ) {
    return this.notificationService.registerDevice(body.userId, body.deviceToken, body.platform);
  }

  @Post('internal/alerts/breach')
  @HttpCode(HttpStatus.OK)
  async handleBreach(
    @Body() body: { userId: string; requiredFloor: number; currentBalance: number }
  ) {
    this.logger.log(`Internal breach alert received for user ${body.userId}`);

    const userDoc = await admin.firestore().collection('users').doc(body.userId).get();
    if (!userDoc.exists) return { status: 'ERROR', message: 'User not found' };

    const userData = userDoc.data();

    // 1. Send Push Notification
    await this.notificationService.sendInteractiveNotification(body.userId, {
      title: '⚠️ Capital Breach Alert',
      body: `Your balance is below the required floor. Current: ₦${body.currentBalance.toLocaleString()}`,
      data: { type: 'BREACH_ALERT' }
    });

    // 2. Send Transactional Email
    await this.emailService.sendCapitalEncroachmentAlert(
      userData?.email,
      userData?.displayName || 'Student',
      body.requiredFloor,
      body.currentBalance
    );

    return { status: 'SUCCESS' };
  }

  // Debug/Internal endpoint to trigger notifications
  @Post('test-send')
  @HttpCode(HttpStatus.OK)
  async testSend(
    @Body() body: { userId: string; title: string; body: string; data?: any }
  ) {
    return this.notificationService.sendInteractiveNotification(body.userId, {
      title: body.title,
      body: body.body,
      data: body.data
    });
  }
}
