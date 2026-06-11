import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, serverTimestamp, query, where, collection, getDocs, limit } from 'firebase-admin/firestore';

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
        phoneNumber: null,
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
// Includes phone number uniqueness enforcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, displayName, photoURL, phoneNumber } = body;

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
          // ====== PHONE UNIQUENESS CHECK ======
          // If a phone number is provided, check it's not already registered
          if (phoneNumber) {
            const phoneQuery = query(
              collection(db, 'users'),
              where('phoneNumber', '==', phoneNumber),
              limit(1)
            );
            const phoneSnapshot = await getDocs(phoneQuery);

            if (!phoneSnapshot.empty) {
              // Phone already registered — return the existing user's data instead
              const existingUser = phoneSnapshot.docs[0];
              console.log(`[User API] Phone ${phoneNumber} already registered to user ${existingUser.id}`);

              // Instead of creating a duplicate, return existing user data
              // The client should sign in with the existing account
              return NextResponse.json({
                user: existingUser.data(),
                warning: 'This phone number is already registered. Signing into existing account.',
              });
            }
          }

          // Create new user with 50 free credits
          await setDoc(userRef, {
            uid,
            email: email || null,
            displayName: displayName || phoneNumber || email?.split('@')[0] || 'User',
            photoURL: photoURL || null,
            phoneNumber: phoneNumber || null,
            credits: 50,
            plan: 'free',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log(`[User API] Created new user: ${uid} (phone: ${phoneNumber || 'none'})`);
        } else {
          // Update existing user
          const updateData: Record<string, unknown> = {
            updatedAt: serverTimestamp(),
          };
          if (email) updateData.email = email;
          if (displayName) updateData.displayName = displayName;
          if (photoURL) updateData.photoURL = photoURL;
          if (phoneNumber && !userDoc.data()?.phoneNumber) {
            updateData.phoneNumber = phoneNumber;
          }

          await setDoc(userRef, updateData, { merge: true });
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
        phoneNumber: phoneNumber || null,
        credits: 50,
        plan: 'free',
      },
    });
  } catch (error) {
    console.error('[User API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
