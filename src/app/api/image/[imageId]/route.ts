import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/storage';
import { isFirebaseConfigured, getAdminStorage } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;

  // If Firebase Storage is configured, try to redirect to the public URL
  if (isFirebaseConfigured()) {
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const file = bucket.file(`generated/${imageId}.jpg`);

      const [exists] = await file.exists();
      if (exists) {
        // Redirect to the Firebase Storage public URL
        const publicUrl = file.publicUrl();
        return NextResponse.redirect(publicUrl);
      }
    } catch (error) {
      console.error('[Image API] Firebase Storage error, falling back to local:', error);
    }
  }

  // Local dev fallback: serve from filesystem
  const buffer = await getImage(imageId);

  if (!buffer) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
