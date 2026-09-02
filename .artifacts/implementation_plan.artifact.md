# Implementation Plan: FCM Push Notifications & Deep-Linking

This plan outlines the integration of Firebase Cloud Messaging (FCM) for multi-platform push notifications (Android, Web) with support for interactive deep-linking and real-time UI drawer synchronization.

## Proposed Changes

### [Component] Backend Notification Service (apps/server)

#### [NEW] [notificationService.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/server/src/services/notificationService.ts)
- Implement `DeviceTokenManagementService` to handle device registration.
- Implement `MultiChannelDispatcherEngine` to send notifications via FCM and record them in Firestore.

#### [NEW] [notification.controller.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/server/src/controllers/notification.controller.ts)
- Add `POST /api/v1/notifications/register-device` endpoint.

---

### [Component] Web Frontend (apps/web-staff)

#### [NEW] [firebase-messaging-sw.js](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/public/firebase-messaging-sw.js)
- Background FCM message handler.
- Notification click listener for deep-linking.

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/context/AuthContext.tsx)
- Add logic to request notification permission and register FCM token upon login.

#### [MODIFY] [StudentMobileFirstDashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StudentMobileFirstDashboard.tsx)
- Integrate real-time notification sync for the red dot and the itemized list in the "Notifications & Alerts" drawer.

---

### [Component] Android App (apps/mobile-android)

#### [NEW] [MyFirebaseMessagingService.kt](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/mobile-android/app/src/main/java/app/basechan_funder/MyFirebaseMessagingService.kt)
- Native FCM message receiver.
- Build system notifications with deep-link Intent extras.

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/mobile-android/app/src/main/AndroidManifest.xml)
- Register `MyFirebaseMessagingService`.
- Add necessary FCM permissions and meta-data.

#### [MODIFY] [MainActivity.kt](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/mobile-android/app/src/main/java/app/basechan_funder/MainActivity.kt)
- Handle deep-link Intents to navigate the WebView to the correct route.

## Verification Plan

### Automated Verification
- Trigger simulated notifications via the backend service and verify FCM delivery.

### Manual Verification
1.  **Device Registration**: Log in on a device and verify the FCM token is saved to the user's Firestore profile.
2.  **Foreground Notification**: Receive a notification while the app is open and verify the red dot updates.
3.  **Background Notification**: Send a push notification while the app is backgrounded, verify the OS banner appears.
4.  **Deep-Linking**: Tap the notification and verify the app opens to the specified route (e.g., transaction details).
