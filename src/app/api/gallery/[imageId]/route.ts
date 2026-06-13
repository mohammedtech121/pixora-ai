import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isFirebaseConfigured, getAdminStorage } from '@/lib/firebase-admin';
import { doc, getDoc, deleteDoc } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/gallery/[imageId]?uid=<userId>
 * Delete an image from Firestore metadata and optionally from Storage.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const userId = request.headers.get('X-User-Id') || request.nextUrl.searchParams.get('uid');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`[Gallery Delete] Deleting image ${imageId} for user ${userId}`);

    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb();
        const imageRef = doc(db, 'user_images', imageId);
        const imageDoc = await getDoc(imageRef);

        if (!imageDoc.exists) {
          return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const imageData = imageDoc.data();

        // Verify ownership — only the owner can delete
        if (imageData.userId !== userId) {
          return NextResponse.json({ error: 'Unauthorized: You can only delete your own images' }, { status: 403 });
        }

        // Delete from Firestore
        await deleteDoc(imageRef);
        console.log(`[Gallery Delete] Deleted Firestore doc: ${imageId}`);

        // Try to delete from Firebase Storage
        try {
          const storage = getAdminStorage();
          const bucket = storage.bucket();
          const file = bucket.file(`generated/${imageId}.jpg`);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log(`[Gallery Delete] Deleted Storage file: ${imageId}`);
          }
        } catch (storageError) {
          console.warn(`[Gallery Delete] Storage delete failed (non-critical):`, storageError);
          // Don't fail the request if storage delete fails
        }

        return NextResponse.json({ success: true, deleted: imageId });

      } catch (firestoreError) {
        console.error('[Gallery Delete] Firestore error:', firestoreError);
        return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  } catch (error) {
    console.error('[Gallery Delete] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
