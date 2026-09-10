// Firebase configuration & initialisation
// Project: basechanfunder
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

export const getActionCodeSettings = () => ({
  // Use current window origin for dynamic environment support
  url: `${window.location.origin}/#/auth/action`,
  handleCodeInApp: true,
});

const firebaseConfig = {
  apiKey: "AIzaSyA00qF-qfcgYJTELOc-vbeMTMRSrVnaY3o",
  authDomain: "e6elixir.firebaseapp.com",
  projectId: "e6elixir",
  storageBucket: "e6elixir.firebasestorage.app",
  messagingSenderId: "73436010834",
  appId: "1:73436010834:web:5c1e14ccd6af339c90028b",
  measurementId: "G-ZZC16KXPDX"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with Local Persistence to survive WebView reloads/navigation
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Asynchronous helper to get messaging instance safely
export const getMessagingInstance = async () => {
  try {
    if (typeof window !== 'undefined' && await isSupported()) {
      return getMessaging(app);
    }
  } catch (err) {
    console.warn('Firebase Messaging skipped: Unsupported browser or SSR environment.');
  }
  return null;
};

export default app;
