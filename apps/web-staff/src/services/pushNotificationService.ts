import { getMessagingInstance } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { getToken as getFcmToken, onMessage as onFcmMessage } from 'firebase/messaging';

// Capacitor imports (optional, assuming they might be present)
// import { PushNotifications } from '@capacitor/push-notifications';

export class PushNotificationService {
  private static instance: PushNotificationService;
  private messaging: any = null;

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initializes Web FCM listeners and permission requests
   */
  public async initWebPush(userId: string) {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return;
      this.messaging = messaging;

      // 1. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // 2. Get Token
      const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('VITE_FIREBASE_VAPID_KEY missing in env');
        return;
      }

      const token = await getFcmToken(messaging, { vapidKey });
      if (token) {
        // 3. Save to User Profile
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcm_tokens: arrayUnion(token),
          updatedAt: new Date()
        });
        console.log('FCM Token registered:', token);
      }

      // 4. Foreground Message Listener
      onFcmMessage(messaging, (payload) => {
        console.log('Foreground Message received:', payload);

        // Display custom glassmorphic toast
        toast.info(payload.notification?.title || 'System Update', {
          description: payload.notification?.body,
          duration: 6000,
          action: payload.data?.studentId ? {
            label: 'View Student',
            onClick: () => {
              // This will be handled via a custom event that MasterAppPortal listens to
              window.dispatchEvent(new CustomEvent('app:navigate:student', {
                detail: {
                  studentId: payload.data?.studentId,
                  action: payload.data?.actionType || 'profile'
                }
              }));
            }
          } : undefined
        });
      });

    } catch (err) {
      console.error('Push notification initialization error:', err);
    }
  }

  /**
   * Initializes Capacitor listeners for Native Mobile (Android/APK)
   */
  public async initNativePush(userId: string, onAction?: (data: any) => void) {
    // Silent return on web, only initialize if Capacitor environment is detected
    const isNative = (window as any).AndroidBridge || (window as any).Capacitor;
    if (!isNative) return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // 1. Request permissions
      const status = await PushNotifications.requestPermissions();
      if (status.receive !== 'granted') return;

      // 2. Register for notifications
      await PushNotifications.register();

      // 3. Token handler
      PushNotifications.addListener('registration', async (token) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcm_tokens: arrayUnion(token.value),
          platform: 'ANDROID_NATIVE'
        });
      });

      // 4. Receive handler
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Native Push Received:', notification);
        toast.info(notification.title || 'Notification', {
           description: notification.body
        });
      });

      // 5. Action handler (Tapping notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Native Push Action:', action);
        const data = action.notification.data;
        if (data && onAction) {
          onAction(data);
        }
      });

    } catch (err) {
      console.warn('Native Push: Capacitor plugins missing or failed to load');
    }
  }
}
