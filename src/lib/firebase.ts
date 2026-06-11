/**
 * Firebase Client SDK for browser
 * Uses NEXT_PUBLIC_ env vars
 * Initialize: auth, firestore, storage
 *
 * Handles the case where Firebase is not configured (dev mode without env vars)
 * by providing null exports and checking before use.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

// Only initialize Firebase if we have the required config
let app: ReturnType<typeof initializeApp> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

if (isFirebaseConfigured) {
  // Initialize Firebase (prevent re-initialization in dev with HMR)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);
}

export const auth = authInstance;
export const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null;
export const db = dbInstance;
export const storage = storageInstance;

/**
 * Create a reCAPTCHA verifier for phone auth
 * Must be called in browser context only
 * The invisible reCAPTCHA renders in the given container
 */
export function createRecaptchaVerifier(containerOrId: string | HTMLElement = 'recaptcha-container'): RecaptchaVerifier | null {
  if (!authInstance || !isFirebaseConfigured) return null;
  try {
    return new RecaptchaVerifier(authInstance, containerOrId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - allow phone sign-in
        console.log('[Firebase] reCAPTCHA verified');
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        console.log('[Firebase] reCAPTCHA expired');
      },
    });
  } catch (error) {
    console.error('[Firebase] Failed to create reCAPTCHA verifier:', error);
    return null;
  }
}

export default app;
