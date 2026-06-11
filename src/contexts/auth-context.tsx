'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  updateProfile,
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, query, where, collection, getDocs, limit } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured, createRecaptchaVerifier } from '@/lib/firebase';

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
  // Email auth (kept for existing users)
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  // Phone auth
  sendPhoneOTP: (phoneNumber: string) => Promise<string>; // returns verificationId for testing
  verifyPhoneOTP: (verificationId: string, otp: string) => Promise<void>;
  // Google auth
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  // Phone auth state
  confirmationResult: ConfirmationResult | null;
  phoneAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneAuthLoading, setPhoneAuthLoading] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

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

  /**
   * Check if a phone number is already registered in Firestore
   * This prevents multi-account abuse — one phone = one account
   */
  const checkPhoneExists = useCallback(async (phoneNumber: string): Promise<string | null> => {
    if (!db) return null;
    try {
      const q = query(
        collection(db, 'users'),
        where('phoneNumber', '==', phoneNumber),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id; // Return the existing user's UID
      }
    } catch (error) {
      console.error('[Auth] Phone check error:', error);
    }
    return null;
  }, []);

  const createUserDocument = useCallback(async (firebaseUser: User, displayName?: string) => {
    try {
      const userDocData: Record<string, unknown> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: displayName || firebaseUser.displayName || firebaseUser.phoneNumber || 'User',
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
          // Update last login and phone number if new
          const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
          if (firebaseUser.phoneNumber && !userDoc.data()?.phoneNumber) {
            updateData.phoneNumber = firebaseUser.phoneNumber;
          }
          await setDoc(userRef, updateData, { merge: true });
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

  // ============ PHONE AUTH ============

  /**
   * Send OTP to the given phone number
   * Returns verificationId (useful for testing)
   * Stores confirmationResult for later OTP verification
   */
  const sendPhoneOTP = useCallback(async (phoneNumber: string): Promise<string> => {
    if (!auth) throw new Error('Firebase is not configured. Please set up Firebase environment variables.');

    setPhoneAuthLoading(true);
    try {
      // Check if phone is already registered — prevent duplicate accounts
      const existingUid = await checkPhoneExists(phoneNumber);
      // We allow existing phones to sign in (they just get their existing account)

      // Create or reuse reCAPTCHA verifier
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = createRecaptchaVerifier('recaptcha-container');
        if (!recaptchaVerifierRef.current) {
          throw new Error('Failed to initialize reCAPTCHA. Please refresh the page and try again.');
        }
      }

      // Send verification code
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      console.log('[Auth] OTP sent to:', phoneNumber);
      return result.verificationId;
    } catch (error: unknown) {
      // Reset reCAPTCHA on error so it can be retried
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      console.error('[Auth] Phone OTP error:', message);
      throw error;
    } finally {
      setPhoneAuthLoading(false);
    }
  }, [checkPhoneExists]);

  /**
   * Verify the OTP code entered by the user
   * On success: signs in the user (creates account if new, or logs into existing)
   */
  const verifyPhoneOTP = useCallback(async (verificationId: string, otp: string) => {
    if (!confirmationResult) {
      throw new Error('No OTP was sent. Please request a new code.');
    }

    setPhoneAuthLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp);
      await createUserDocument(credential.user);
      setConfirmationResult(null);

      // Reset reCAPTCHA after successful verification
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      console.log('[Auth] Phone verified successfully:', credential.user.uid);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid OTP';
      if (message.includes('invalid-verification-code') || message.includes('Invalid verification code')) {
        throw new Error('Incorrect OTP. Please check and try again.');
      } else if (message.includes('expired') || message.includes('session')) {
        throw new Error('OTP has expired. Please request a new one.');
      }
      throw new Error(message);
    } finally {
      setPhoneAuthLoading(false);
    }
  }, [confirmationResult, createUserDocument]);

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
    setConfirmationResult(null);
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
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
        sendPhoneOTP,
        verifyPhoneOTP,
        confirmationResult,
        phoneAuthLoading,
      }}
    >
      {/* Invisible reCAPTCHA container for phone auth */}
      <div id="recaptcha-container" />
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
