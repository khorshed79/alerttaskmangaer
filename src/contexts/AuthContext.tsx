import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../services/firebase/config';
import {
  bootstrapUserWorkspace,
  deleteAllUserFirestoreData,
} from '../services/firebase/firestoreService';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  connectionOk: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<boolean>;
  changeUserPassword: (newPassword: string) => Promise<void>;
  deleteAccountCompletely: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [connectionOk, setConnectionOk] = useState(true);

  useEffect(() => {
    testConnection().then((ok) => setConnectionOk(ok));
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          await bootstrapUserWorkspace(firebaseUser);
        } catch (err) {
          console.error('Bootstrap workspace error:', err);
        }
      }
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      await bootstrapUserWorkspace(cred.user);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user && cred.user.emailVerified) {
      await bootstrapUserWorkspace(cred.user);
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name.trim().slice(0, 80) });
      await sendEmailVerification(cred.user);
      setUser({ ...cred.user });
    }
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const refreshAuthUser = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    if (refreshed.emailVerified) {
      await bootstrapUserWorkspace(refreshed);
    }
    setUser(refreshed ? ({ ...refreshed } as User) : null);
    return Boolean(refreshed?.emailVerified);
  };

  const changeUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await updatePassword(auth.currentUser, newPassword);
  };

  const deleteAccountCompletely = async () => {
    const current = auth.currentUser;
    if (!current) throw new Error('Not authenticated');
    const uid = current.uid;

    // Delete Firestore user data first while token is valid
    await deleteAllUserFirestoreData(uid);
    try {
      await deleteUser(current);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/requires-recent-login') {
        await reauthenticateWithPopup(current, googleProvider);
        await deleteUser(current);
      } else {
        throw err;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        connectionOk,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendResetEmail,
        resendVerificationEmail,
        refreshAuthUser,
        changeUserPassword,
        deleteAccountCompletely,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
