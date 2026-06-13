import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, deleteDoc } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gallery?uid=<userId>&limit=<number>
 * Fetch all images for a given user from Firestore, newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id') || request.nextUrl.searchParams.get('uid');
    const limitCount = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 100, 1), 500);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`[Gallery API] Fetching gallery for user: ${userId}, limit: ${limitCount}`);

    // If Firebase is configured, fetch from Firestore
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb();

        // Query user_images collection filtered by userId, ordered by createdAt desc
        const imagesRef = collection(db, 'user_images');
        const q = query(
          imagesRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const snapshot = await q.docs.length >= 0 ? await getDocs(q) : { docs: [] } as any;

        const images = snapshot.docs.map((docSnap: any) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            url: data.url || '',
            prompt: data.prompt || '',
            style: data.style || 'realistic',
            size: data.size || '1024x1024',
            model: data.model || '',
            negativePrompt: data.negativePrompt || '',
            userId: data.userId || '',
            createdAt: data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
            timestamp: data.createdAt ? data.createdAt._seconds * 1000 : Date.now(),
          };
        });

        console.log(`[Gallery API] Found ${images.length} images for user ${userId}`);

        return NextResponse.json({
          images,
          total: images.length,
          userId,
        });
      } catch (firestoreError) {
        console.error('[Gallery API] Firestore query error:', firestoreError);
        // If index doesn't exist, try a simpler query
        try {
          const db = getAdminDb();
          const imagesRef = collection(db, 'user_images');
          const q = query(
            imagesRef,
            where('userId', '==', userId),
            limit(limitCount)
          );
          const snapshot = await getDocs(q);

          const images = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              url: data.url || '',
              prompt: data.prompt || '',
              style: data.style || 'realistic',
              size: data.size || '1024x1024',
              model: data.model || '',
              negativePrompt: data.negativePrompt || '',
              userId: data.userId || '',
              createdAt: data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
              timestamp: data.createdAt ? data.createdAt._seconds * 1000 : Date.now(),
            };
          }).sort((a, b) => b.timestamp - a.timestamp); // Sort manually if orderBy fails

          console.log(`[Gallery API] Fallback query found ${images.length} images`);
          return NextResponse.json({ images, total: images.length, userId });
        } catch (fallbackError) {
          console.error('[Gallery API] Fallback query also failed:', fallbackError);
        }
      }
    }

    // No Firebase or fallback failed — return empty gallery
    return NextResponse.json({ images: [], total: 0, userId });

  } catch (error) {
    console.error('[Gallery API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
