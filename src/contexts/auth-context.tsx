'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  credits: number;
  plan: 'free' | 'starter' | 'pro';
  createdAt: unknown;
  updatedAt: unknown;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  // Email auth
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  // Google auth
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  const fetchUserData = useCallback(async (uid: string): Promise<UserData | null> => {
    try {
      // Try to get from Firestore client SDK
      if (db) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          return userDoc.data() as UserData;
        }
      }

      // Fallback: fetch from our API
      const response = await fetch('/api/auth/user', {
        headers: {
          'X-User-Id': uid,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.user as UserData;
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch user data:', error);
    }
    return null;
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user) {
      const data = await fetchUserData(user.uid);
      setUserData(data);
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    // If Firebase is not configured, no auth listener needed
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const data = await fetchUserData(firebaseUser.uid);
        setUserData(data);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const createUserDocument = useCallback(async (firebaseUser: User, displayName?: string) => {
    try {
      const userDocData: Record<string, unknown> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: displayName || firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || null,
        phoneNumber: firebaseUser.phoneNumber || null,
        credits: 10,
        plan: 'free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Try Firestore client SDK first
      if (db) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, userDocData);
        } else {
          // Update last login
          await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
        }
      }

      // Also notify our API to ensure server-side consistency
      await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: userDocData.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
        }),
      });
    } catch (error) {
      console.error('[Auth] Failed to create user document:', error);
    }
  }, []);

  // ============ EMAIL AUTH ============

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(credential.user);
  }, [createUserDocument]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!auth) throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
    await createUserDocument(credential.user, displayName);
  }, [createUserDocument]);

  // ============ GOOGLE AUTH ============

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider) throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
    const credential = await signInWithPopup(auth, googleProvider);
    await createUserDocument(credential.user);
  }, [createUserDocument]);

  // ============ SIGN OUT ============

  const signOut = useCallback(async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setUserData(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
