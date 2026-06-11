import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// GET - Get user's credit balance from Firestore
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
          const data = userDoc.data();
          return NextResponse.json({ credits: data.credits ?? 0, plan: data.plan ?? 'free' });
        }
      } catch (error) {
        console.error('[Credits API] Firestore error:', error);
      }
    }

    // Fallback: return default credits
    return NextResponse.json({ credits: 50, plan: 'free' });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Deduct credits after generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, amount } = body;

    if (!uid || !amount) {
      return NextResponse.json({ error: 'uid and amount are required' }, { status: 400 });
    }

    const deductAmount = Math.max(1, Math.floor(amount));

    // If Firebase is configured, use Firestore
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb();
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists) {
          const currentCredits = userDoc.data().credits ?? 0;

          if (currentCredits < deductAmount) {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
          }

          await updateDoc(userRef, {
            credits: currentCredits - deductAmount,
            updatedAt: serverTimestamp(),
          });

          return NextResponse.json({
            credits: currentCredits - deductAmount,
            deducted: deductAmount,
          });
        } else {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
      } catch (error) {
        console.error('[Credits API] Firestore error:', error);
      }
    }

    // Fallback: just return success (dev mode without Firebase)
    return NextResponse.json({ credits: 50 - deductAmount, deducted: deductAmount });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
