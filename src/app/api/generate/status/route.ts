import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    userId: job.userId,
    status: job.status,
    prompt: job.prompt,
    style: job.style,
    size: job.size,
    numImages: job.numImages,
    images: job.images,
    error: job.error,
    createdAt: job.createdAt,
  });
}
