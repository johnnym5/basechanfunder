// Auth Context — provides currentUser, userRole, and loading state app-wide
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  doc, getDoc, setDoc, serverTimestamp, updateDoc, arrayUnion
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { auth, db, getMessagingInstance } from '../firebase';

export type UserRole = 'STUDENT' | 'STAFF_AUDITOR' | 'COUNSELOR' | 'ADMIN_GOVERNANCE';

export interface AppUser {
  uid: string;
  email: string;
  username?: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  isApproved: boolean;
  createdAt?: unknown;
}

interface AuthContextValue {
  currentUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  appUser: null,
  loading: true,
  role: null,
});

// Determine role from email domain
export function deriveRole(email: string): UserRole {
  const lower = email.toLowerCase();
  if (lower.endsWith('@basechaninternational.com')) return 'ADMIN_GOVERNANCE';
  if (lower.includes('auditor')) return 'STAFF_AUDITOR';
  if (lower.endsWith('.basechaninternational@gmail.com') || lower.includes('counselor')) return 'COUNSELOR';
  return 'STUDENT';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          
          const role = deriveRole(firebaseUser.email ?? '');
          const isApproved = role !== 'STUDENT'; // Admins/Counselors auto-approved, Students need manual approval
          const derivedUsername = (firebaseUser.email?.split('@')[0] || firebaseUser.uid)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '');

          // Fallback base user profile (ensures immediate responsiveness)
          let resolvedAppUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            username: derivedUsername,
            displayName: firebaseUser.displayName || derivedUsername || 'User',
            photoURL: firebaseUser.photoURL ?? '',
            role,
            isApproved,
          };

          // Attempt Firestore sync if database is available
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
              const data = snap.data() as AppUser;
              if (!data.username && firebaseUser.email) {
                await setDoc(userRef, { username: derivedUsername }, { merge: true }).catch(() => {});
                data.username = derivedUsername;
              }
              resolvedAppUser = { ...resolvedAppUser, ...data };
            } else {
              // Create user profile in Firestore
              await setDoc(userRef, {
                ...resolvedAppUser,
                createdAt: serverTimestamp(),
              }).catch((e) => {
                console.warn('Firestore user profile sync deferred:', e.message);
              });
            }

            // --- FCM Registration ---
            const messaging = await getMessagingInstance();
            const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string) ||
                             (typeof process !== 'undefined' ? (process.env as any).NEXT_PUBLIC_FIREBASE_VAPID_KEY : undefined) ||
                             (typeof process !== 'undefined' ? (process.env as any).REACT_APP_FIREBASE_VAPID_KEY : undefined);
            const cleanVapidKey = vapidKey?.trim();

            if (messaging && cleanVapidKey && typeof Notification !== 'undefined') {
              try {
                let permission = Notification.permission;
                if (permission === 'default') {
                  permission = await Notification.requestPermission();
                }

                if (permission === 'granted') {
                  const token = await getToken(messaging, { vapidKey: cleanVapidKey });
                  if (token && token !== fcmToken) {
                    console.log("FCM Token acquired:", token);

                    // 1. Sync with Firestore (for backward compatibility)
                    await updateDoc(userRef, {
                      pushTokens: arrayUnion({ token, platform: 'WEB', updatedAt: new Date().toISOString() })
                    }).catch(() => {});

                    // 2. Sync with Backend Service
                    await fetch('/api/v1/notifications/register-device', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
                      },
                      body: JSON.stringify({
                        userId: firebaseUser.uid,
                        deviceToken: token,
                        platform: 'WEB'
                      })
                    }).then(res => {
                      if (res.ok) {
                        setFcmToken(token);
                        console.log("Device registered with backend successfully");
                      }
                    }).catch(err => console.warn("Backend device registration failed:", err));
                  }
                }
              } catch (error) {
                console.warn("FCM push registration skipped:", error);
              }

              // Foreground message listener
              onMessage(messaging, (payload) => {
                console.log("Foreground message received:", payload);
              });
            }

          } catch (firestoreErr: any) {
            console.warn('Firestore database access note:', firestoreErr?.message || firestoreErr);
          }

          setAppUser(resolvedAppUser);
        } else {
          setCurrentUser(null);
          setAppUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, appUser, loading, role: appUser?.role ?? null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
