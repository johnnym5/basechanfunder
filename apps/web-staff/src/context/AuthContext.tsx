// Auth Context — provides currentUser, userRole, and loading state app-wide
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 'STUDENT' | 'STAFF_AUDITOR' | 'ADMIN_GOVERNANCE';

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
  if (email.endsWith('@basechaninternational.com')) return 'ADMIN_GOVERNANCE';
  return 'STUDENT';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        // Fetch or create user profile document in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data() as AppUser;
          // If username wasn't set previously, set it now
          if (!data.username && firebaseUser.email) {
            const derivedUsername = (firebaseUser.email.split('@')[0] || firebaseUser.uid)
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '');
            await setDoc(userRef, { username: derivedUsername }, { merge: true });
            data.username = derivedUsername;
          }
          setAppUser(data);
        } else {
          // First login — derive role from email and create profile
          const role = deriveRole(firebaseUser.email ?? '');
          const derivedUsername = ((firebaseUser.email?.split('@')[0] || firebaseUser.uid))
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '');

          const newUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            username: derivedUsername,
            displayName: firebaseUser.displayName ?? '',
            photoURL: firebaseUser.photoURL ?? '',
            role,
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newUser);
          setAppUser(newUser);
        }
      } else {
        setCurrentUser(null);
        setAppUser(null);
      }
      setLoading(false);
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
