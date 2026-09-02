import * as admin from 'firebase-admin';
import { Injectable, Logger } from '@nestjs/common';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly db = admin.firestore();

  /**
   * Device Token Management Service
   * Registers or updates a device token for a user.
   */
  async registerDevice(userId: string, deviceToken: string, platform: 'ANDROID' | 'IOS' | 'WEB') {
    this.logger.log(`Registering device for user ${userId} on platform ${platform}`);

    const userRef = this.db.collection('users').doc(userId);

    await this.db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const pushTokens = userData?.pushTokens || [];

      // Prevent duplicates
      if (!pushTokens.some((t: any) => t.token === deviceToken)) {
        pushTokens.push({
          token: deviceToken,
          platform,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        transaction.update(userRef, { pushTokens });
      }
    });

    return { status: 'SUCCESS' };
  }

  /**
   * Multi-Channel Dispatcher Engine
   * Sends interactive notifications via FCM and records them in Firestore.
   */
  async sendInteractiveNotification(userId: string, payload: NotificationPayload) {
    this.logger.log(`Dispatching interactive notification to user ${userId}`);

    // 1. Save in-app record to 'notifications' collection
    const notificationRecord = {
      userId,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const notifRef = await this.db.collection('notifications').add(notificationRecord);

    // 2. Fetch active push tokens for the user
    const userDoc = await this.db.collection('users').doc(userId).get();
    const pushTokens = userDoc.data()?.pushTokens || [];

    if (pushTokens.length === 0) {
      this.logger.warn(`No push tokens found for user ${userId}`);
      return { status: 'NO_TOKENS', id: notifRef.id };
    }

    // 3. Dispatch FCM push messages
    const messages = pushTokens.map((t: any) => ({
      token: t.token,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: {
        ...payload.data,
        notificationId: notifRef.id // Include record ID for unread sync
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'basechan_funder_alerts',
          clickAction: 'OPEN_DASHBOARD'
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: '/favicon.png',
          badge: '/logo.png'
        }
      }
    }));

    try {
      const response = await admin.messaging().sendEach(messages);
      this.logger.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
      return {
        status: 'DISPATCHED',
        id: notifRef.id,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      this.logger.error(`FCM dispatch error: ${error.message}`);
      return { status: 'ERROR', message: error.message };
    }
  }
}
