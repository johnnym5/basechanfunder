// Firebase configuration & initialisation
// Project: basechanfunder
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

export const getActionCodeSettings = () => ({
  // Use current window origin for dynamic environment support
  url: `${window.location.origin}/#/auth/action`,
  handleCodeInApp: true,
});

const firebaseConfig = {
  apiKey: 'AIzaSyCRRpdnvjEuWvGfWXRRlUP88IY2KhJdHOg',
  authDomain: 'basechanfunder.firebaseapp.com',
  projectId: 'basechanfunder',
  storageBucket: 'basechanfunder.firebasestorage.app',
  messagingSenderId: '1053228569213',
  appId: '1:1053228569213:web:e4ca60dd767a73fc9e5714',
  measurementId: 'G-MP683BDWSZ',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, 'basechanfunder');
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
