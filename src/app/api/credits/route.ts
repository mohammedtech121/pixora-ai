import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// Plan definitions
const PLAN_CREDITS: Record<string, number> = {
  free: 10,     // 10 credits on signup (one-time)
  starter: 100, // 100 credits/month
  pro: 500,     // 500 credits/month
};

// GET - Get user's credit balance and plan info from Firestore
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
          return NextResponse.json({
            credits: data.credits ?? 0,
            plan: data.plan ?? 'free',
            planCredits: PLAN_CREDITS[data.plan ?? 'free'] ?? 10,
          });
        }
      } catch (error) {
        console.error('[Credits API] Firestore error:', error);
      }
    }

    // Fallback: return default credits
    return NextResponse.json({ credits: 10, plan: 'free', planCredits: 10 });
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
    return NextResponse.json({ credits: 10 - deductAmount, deducted: deductAmount });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Add credits to user (for plan upgrades or purchases)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, amount, plan } = body;

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // If Firebase is configured, use Firestore
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb();
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists) {
          const currentCredits = userDoc.data().credits ?? 0;
          let newCredits = currentCredits;
          const updateData: Record<string, unknown> = {
            updatedAt: serverTimestamp(),
          };

          // If upgrading plan, set plan and add plan credits
          if (plan && PLAN_CREDITS[plan] !== undefined) {
            updateData.plan = plan;
            // For paid plans, reset credits to plan amount (monthly reset)
            // For free plan, just add the one-time credits
            if (plan !== 'free') {
              newCredits = PLAN_CREDITS[plan];
            } else {
              newCredits = currentCredits + (amount || 0);
            }
            updateData.credits = newCredits;
          } else if (amount) {
            // Just add credits (e.g., top-up purchase)
            const addAmount = Math.max(1, Math.floor(amount));
            newCredits = currentCredits + addAmount;
            updateData.credits = newCredits;
          }

          await updateDoc(userRef, updateData);

          return NextResponse.json({
            credits: newCredits,
            plan: plan || userDoc.data().plan || 'free',
          });
        } else {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
      } catch (error) {
        console.error('[Credits API] Firestore error:', error);
      }
    }

    // Fallback
    return NextResponse.json({
      credits: (amount || PLAN_CREDITS[plan] || 10),
      plan: plan || 'free',
    });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
