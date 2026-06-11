import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// GET - Get current user's data from Firestore
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id') || request.nextUrl.searchParams.get('uid');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // If Firebase is configured, use Firestore
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb();
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists) {
          return NextResponse.json({ user: userDoc.data() });
        }
      } catch (error) {
        console.error('[User API] Firestore error:', error);
      }
    }

    // Fallback: return default user data
    return NextResponse.json({
      user: {
        uid: userId,
        email: null,
        displayName: 'User',
        photoURL: null,
        credits: 50,
        plan: 'free',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('[User API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/update user document in Firestore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, displayName, photoURL } = body;

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // If Firebase is configured, use Firestore
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb();
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists) {
          // Create new user with 50 free credits
          await setDoc(userRef, {
            uid,
            email: email || null,
            displayName: displayName || email?.split('@')[0] || 'User',
            photoURL: photoURL || null,
            credits: 50,
            plan: 'free',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log(`[User API] Created new user: ${uid}`);
        } else {
          // Update existing user
          await setDoc(userRef, {
            updatedAt: serverTimestamp(),
            ...(email && { email }),
            ...(displayName && { displayName }),
            ...(photoURL && { photoURL }),
          }, { merge: true });
        }

        // Return the user data
        const updatedDoc = await getDoc(userRef);
        return NextResponse.json({ user: updatedDoc.data() });
      } catch (error) {
        console.error('[User API] Firestore error:', error);
      }
    }

    // Fallback response
    return NextResponse.json({
      user: {
        uid,
        email: email || null,
        displayName: displayName || 'User',
        photoURL: photoURL || null,
        credits: 50,
        plan: 'free',
      },
    });
  } catch (error) {
    console.error('[User API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
