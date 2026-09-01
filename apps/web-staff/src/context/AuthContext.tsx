// Auth Context — provides currentUser, userRole, and loading state app-wide
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 'STUDENT' | 'STAFF_AUDITOR' | 'COUNSELOR' | 'ADMIN_GOVERNANCE';

export interface AppUser {
  uid: string;
  email: string;
  username?: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
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
function deriveRole(email: string): UserRole {
  const lower = email.toLowerCase();
  if (lower.endsWith('@basechaninternational.com')) return 'ADMIN_GOVERNANCE';
  if (lower.endsWith('.basechaninternational@gmail.com')) return 'COUNSELOR';
  return 'STUDENT';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          
          const role = deriveRole(firebaseUser.email ?? '');
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
