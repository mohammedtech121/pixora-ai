/**
 * Firebase Admin SDK for server-side API routes
 * Uses FIREBASE_ADMIN_* env vars (or service account JSON)
 * Initialize: admin app, admin auth, admin firestore, admin storage
 */

import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;
let adminStorage: admin.storage.Storage;

function getAdminApp(): admin.app.App {
  if (adminApp) return adminApp;

  // Check if already initialized (prevent re-initialization in dev)
  const existingApps = admin.getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0]!;
    return adminApp;
  }

  // Check for required env vars
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[Firebase Admin] Missing FIREBASE_ADMIN_* environment variables. ' +
      'Server-side Firebase operations will not work. ' +
      'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
    );

    // Initialize with a placeholder config to avoid crashes
    // In dev mode without Firebase, we'll use fallbacks
    adminApp = admin.initializeApp({
      projectId: projectId || 'placeholder-project',
    });
    return adminApp;
  }

  // Replace escaped newlines in private key
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  });

  return adminApp;
}

export function getAdminAuth(): admin.auth.Auth {
  if (adminAuth) return adminAuth;
  adminAuth = getAdminApp().auth();
  return adminAuth;
}

export function getAdminDb(): admin.firestore.Firestore {
  if (adminDb) return adminDb;
  adminDb = getAdminApp().firestore();
  return adminDb;
}

export function getAdminStorage(): admin.storage.Storage {
  if (adminStorage) return adminStorage;
  adminStorage = getAdminApp().storage();
  return adminStorage;
}

/**
 * Verify a Firebase ID token and return the decoded token
 * Returns null if verification fails (e.g., no Firebase config)
 */
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('[Firebase Admin] Token verification failed:', error);
    return null;
  }
}

/**
 * Check if Firebase Admin is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}
