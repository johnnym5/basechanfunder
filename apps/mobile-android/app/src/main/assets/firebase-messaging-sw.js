importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Updated for E6 Elixir
firebase.initializeApp({
  apiKey: "AIzaSyA00qF-qfcgYJTELOc-vbeMTMRSrVnaY3o",
  authDomain: "e6elixir.firebaseapp.com",
  projectId: "e6elixir",
  storageBucket: "e6elixir.firebasestorage.app",
  messagingSenderId: "73436010834",
  appId: "1:73436010834:web:5c1e14ccd6af339c90028b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'E6 Elixir Update';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.');
  event.notification.close();

  const deepLink = event.notification.data?.deepLinkRoute || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(c => c.navigate(deepLink));
      }
      return clients.openWindow(deepLink);
    })
  );
});
