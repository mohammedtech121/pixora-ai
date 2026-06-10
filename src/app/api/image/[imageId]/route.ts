import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;

  // On Vercel Blob, images are served directly from the blob URL — no need for this endpoint
  // This is only used in local dev mode

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
