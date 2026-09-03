// Auth Context — provides currentUser, userRole, and loading state app-wide
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  doc, getDoc, setDoc, serverTimestamp, updateDoc, arrayUnion, onSnapshot
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { auth, db, getMessagingInstance } from '../firebase';

export type UserRole = 'STUDENT' | 'STAFF_AUDITOR' | 'COUNSELOR' | 'ADMIN_GOVERNANCE';

export const PRE_APPROVED_COUNSELORS = [
  { name: "Peter", email: "peter.basechaninternational@gmail.com" },
  { name: "Feridu", email: "feridu.basechaninternational@gmail.com" },
  { name: "Effiong", email: "effiong.basechaninternational@gmail.com" },
  { name: "Cletus", email: "cletus.basechaninternational@gmail.com" },
  { name: "Izunyon", email: "izunyon.basechaninternational@gmail.com" },
  { name: "Jumai", email: "jumaibasechaninternational@gmail.com" },
  { name: "Nwaiwu Blessing OGE", email: "nwaiwu.basechaninternational@gmail.com" },
];

export interface AppUser {
// ... existing interface ...
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
export function deriveRole(email: string): { role: UserRole; name?: string } {
  const lower = email.toLowerCase().trim();

  // 1. Check Counselor Whitelist
  const preApproved = PRE_APPROVED_COUNSELORS.find(c => c.email.toLowerCase() === lower);
  if (preApproved) return { role: 'COUNSELOR', name: preApproved.name };

  // 2. Check Admin Domain
  if (lower.endsWith('@basechaninternational.com')) return { role: 'ADMIN_GOVERNANCE' };

  // 3. Fallbacks
  if (lower.includes('auditor')) return { role: 'STAFF_AUDITOR' };
  if (lower.endsWith('.basechaninternational@gmail.com') || lower.includes('counselor')) return { role: 'COUNSELOR' };

  return { role: 'STUDENT' };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // 0. Cleanup previous profile listener if exists
        if (profileUnsub) {
          profileUnsub();
          profileUnsub = null;
        }

        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          
          const { role, name: whitelistedName } = deriveRole(firebaseUser.email ?? '');
          const isApproved = role !== 'STUDENT';
          const derivedUsername = (firebaseUser.email?.split('@')[0] || firebaseUser.uid)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '');

          const resolvedAppUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            username: derivedUsername,
            displayName: whitelistedName || firebaseUser.displayName || derivedUsername || 'User',
            photoURL: firebaseUser.photoURL ?? '',
            role,
            isApproved,
          };

          // 1. Set initial local state immediately to avoid flicker/blank screens
          setAppUser(resolvedAppUser);

          // 2. Setup real-time listener for user profile
          const userRef = doc(db, 'users', firebaseUser.uid);

          // 2b. Sync Claims with Backend (Fire and forget or check result)
          fetch('/api/v1/auth/sync-claims', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: firebaseUser.uid, email: firebaseUser.email })
          }).catch(err => console.warn("Claims sync deferred:", err));

          profileUnsub = onSnapshot(userRef, async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as AppUser;
              // If we find a profile, merge it with our local resolved user
              setAppUser(prev => ({ ...resolvedAppUser, ...prev, ...data }));
            } else {
              // Create user profile in Firestore if it doesn't exist
              await setDoc(userRef, {
                ...resolvedAppUser,
                createdAt: serverTimestamp(),
              }).catch((e) => {
                console.warn('Firestore user profile creation deferred:', e.message);
              });
            }
          }, (err) => {
            console.error("Firestore Profile Listener Error:", err);
          });

          // 3. Handle FCM (Async, non-blocking)
          try {
            const messaging = await getMessagingInstance();
            const vapidKey = ((import.meta as any).env?.VITE_FIREBASE_VAPID_KEY as string) ||
                             (typeof process !== 'undefined' ? (process.env as any).NEXT_PUBLIC_FIREBASE_VAPID_KEY : undefined);

            if (messaging && vapidKey && typeof Notification !== 'undefined') {
              if (Notification.permission === 'granted') {
                const token = await getToken(messaging, { vapidKey });
                if (token && token !== fcmToken) {
                  await updateDoc(userRef, {
                    pushTokens: arrayUnion({ token, platform: 'WEB', updatedAt: new Date().toISOString() })
                  }).catch(() => {});
                  setFcmToken(token);
                }
              }
            }
          } catch (fcmErr) {
            console.warn("FCM setup background error:", fcmErr);
          }

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

    return () => {
      unsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, appUser, loading, role: appUser?.role ?? null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
