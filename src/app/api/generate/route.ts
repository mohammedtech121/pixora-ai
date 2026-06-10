import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { setJob } from '@/lib/storage';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const STYLE_PRESETS: Record<string, string> = {
  realistic: 'hyperrealistic, photorealistic, 8k, detailed, ',
  anime: 'anime style, cel-shaded, vibrant colors, ',
  cinematic: 'cinematic lighting, film grain, dramatic, ',
  '3d': '3D render, octane render, volumetric lighting, ',
  fantasy: 'fantasy art, ethereal, magical, detailed illustration, ',
  cyberpunk: 'cyberpunk, neon lights, futuristic, dark atmosphere, ',
  pixar: 'pixar style, 3D animation, friendly, colorful, ',
  ghibli: 'studio ghibli style, watercolor, soft lighting, whimsical, ',
};

const VALID_SIZES = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];

interface GenerationJob {
  id: string;
  status: 'processing' | 'complete' | 'error';
  prompt: string;
  style: string;
  size: string;
  numImages: number;
  images: Array<{
    id: string;
    url: string;
    prompt: string;
    style: string;
    size: string;
    timestamp: number;
  }>;
  error?: string;
  createdAt: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Generation timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { prompt, negativePrompt, style, size, numImages } = body;

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const stylePreset = style && STYLE_PRESETS[style] ? style : 'realistic';
  const validatedSize = size && VALID_SIZES.includes(size) ? size : '1024x1024';
  const validatedNumImages = Math.min(Math.max(Number(numImages) || 1, 1), 4);
  const stylePrefix = STYLE_PRESETS[stylePreset] || '';
  const enhancedPrompt = `${stylePrefix}${prompt}${negativePrompt ? `. Avoid: ${negativePrompt}` : ''}`;

  // Create a job
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job: GenerationJob = {
    id: jobId,
    status: 'processing',
    prompt,
    style: stylePreset,
    size: validatedSize,
    numImages: validatedNumImages,
    images: [],
    createdAt: Date.now(),
  };

  // Save job to storage
  await setJob(jobId, job);

  // Return job ID immediately
  const response = NextResponse.json({
    jobId,
    status: 'processing',
    message: 'Generation started. Poll /api/generate/status for updates.',
  });

  // Start generation in the background (fire-and-forget)
  // On Vercel, this works because the function stays alive after response
  (async () => {
    console.log(`[Generate] Job ${jobId} started:`, { prompt: prompt.slice(0, 50), style: stylePreset, size: validatedSize, numImages: validatedNumImages });

    try {
      const { saveImage } = await import('@/lib/storage');

      let zai;
      try {
        zai = await withTimeout(ZAI.create(), 15000);
      } catch (initError) {
        job.status = 'error';
        job.error = 'AI service initialization failed. Please try again.';
        await setJob(jobId, job);
        console.error(`[Generate] Job ${jobId} SDK init failed:`, initError);
        return;
      }

      for (let i = 0; i < validatedNumImages; i++) {
        try {
          console.log(`[Generate] Job ${jobId} - image ${i + 1}/${validatedNumImages}...`);

          const aiResponse = await withTimeout(
            zai.images.generations.create({
              prompt: enhancedPrompt,
              size: validatedSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440',
            }),
            80000
          ) as { data?: Array<{ base64?: string; url?: string }> };

          const item = aiResponse.data?.[0];
          if (item && (item.base64 || item.url)) {
            const imageId = `img_${Date.now()}_${i}`;
            let imageBuffer: Buffer | null = null;

            if (item.base64) {
              imageBuffer = Buffer.from(item.base64, 'base64');
            } else if (item.url) {
              try {
                const imgResp = await fetch(item.url);
                const arrayBuffer = await imgResp.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
              } catch (dlError) {
                console.error(`[Generate] Job ${jobId} - failed to download image:`, dlError);
              }
            }

            if (imageBuffer) {
              const imageUrl = await saveImage(imageId, imageBuffer);

              job.images.push({
                id: imageId,
                url: imageUrl,
                prompt,
                style: stylePreset,
                size: validatedSize,
                timestamp: Date.now(),
              });

              // Update job after each image so polling picks it up
              await setJob(jobId, job);

              console.log(`[Generate] Job ${jobId} - image ${i + 1} saved (${imageId})`);
            }
          } else {
            console.error(`[Generate] Job ${jobId} - image ${i + 1} returned empty data`);
          }
        } catch (imgError) {
          console.error(`[Generate] Job ${jobId} - image ${i + 1} failed:`, imgError instanceof Error ? imgError.message : imgError);
        }
      }

      if (job.images.length === 0) {
        job.status = 'error';
        job.error = 'Could not generate images. The AI service may be temporarily busy — please try again.';
      } else {
        job.status = 'complete';
      }

      await setJob(jobId, job);
      console.log(`[Generate] Job ${jobId} ${job.status}: ${job.images.length} of ${validatedNumImages} images`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.status = 'error';
      job.error = `Generation failed: ${errorMessage}`;
      await setJob(jobId, job);
      console.error(`[Generate] Job ${jobId} fatal error:`, errorMessage);
    }
  })();

  return response;
}
