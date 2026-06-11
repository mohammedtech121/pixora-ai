import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { setJob } from '@/lib/storage';
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase-admin/firestore';

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
  userId: string;
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

  const { prompt, negativePrompt, style, size, numImages, userId } = body;

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  // Plan-based restrictions
  const FREE_STYLES = ['realistic', 'anime', 'cinematic', '3d'];
  const FREE_SIZE = '1024x1024';

  let stylePreset = style && STYLE_PRESETS[style] ? style : 'realistic';
  let validatedSize = size && VALID_SIZES.includes(size) ? size : '1024x1024';
  const validatedNumImages = Math.min(Math.max(Number(numImages) || 1, 1), 4);
  const stylePrefix = STYLE_PRESETS[stylePreset] || '';
  const enhancedPrompt = `${stylePrefix}${prompt}${negativePrompt ? `. Avoid: ${negativePrompt}` : ''}`;

  // Check user credits and plan if userId is provided and Firebase is configured
  const effectiveUserId = userId || 'anonymous';
  let userPlan = 'free';
  if (userId && isFirebaseConfigured()) {
    try {
      const db = getAdminDb();
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists) {
        const userData = userDoc.data();
        userPlan = userData.plan || 'free';
        if ((userData.credits ?? 0) < validatedNumImages) {
          return NextResponse.json({ error: 'Not enough credits' }, { status: 400 });
        }

        // Enforce plan restrictions for free users
        if (userPlan === 'free') {
          // Free users can only use basic styles
          if (!FREE_STYLES.includes(stylePreset)) {
            return NextResponse.json({
              error: `The "${stylePreset}" style requires a Starter or Pro plan. Upgrade to unlock all styles.`,
              upgradeRequired: true,
              restrictedFeature: 'style',
            }, { status: 403 });
          }
          // Free users can only use 1024x1024
          if (validatedSize !== FREE_SIZE) {
            return NextResponse.json({
              error: `The "${validatedSize}" resolution requires a Starter or Pro plan. Upgrade to unlock all resolutions.`,
              upgradeRequired: true,
              restrictedFeature: 'size',
            }, { status: 403 });
          }
          // Free users cannot use negative prompts
          if (negativePrompt && negativePrompt.trim()) {
            return NextResponse.json({
              error: 'Negative prompts require a Starter or Pro plan. Upgrade to unlock this feature.',
              upgradeRequired: true,
              restrictedFeature: 'negativePrompt',
            }, { status: 403 });
          }
        }
      }
    } catch (error) {
      console.error('[Generate] Credit check error:', error);
    }
  }

  // Create a job
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job: GenerationJob = {
    id: jobId,
    userId: effectiveUserId,
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
  (async () => {
    console.log(`[Generate] Job ${jobId} started:`, { prompt: prompt.slice(0, 50), style: stylePreset, size: validatedSize, numImages: validatedNumImages, userId: effectiveUserId });

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

              // Save image metadata to Firestore (if configured)
              if (isFirebaseConfigured() && effectiveUserId !== 'anonymous') {
                try {
                  const db = getAdminDb();
                  const { setDoc: adminSetDoc } = await import('firebase-admin/firestore');
                  await adminSetDoc(doc(db, 'user_images', imageId), {
                    userId: effectiveUserId,
                    jobId,
                    url: imageUrl,
                    prompt,
                    style: stylePreset,
                    size: validatedSize,
                    createdAt: serverTimestamp(),
                  });
                } catch (imgMetaError) {
                  console.error(`[Generate] Failed to save image metadata:`, imgMetaError);
                }
              }

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

        // Deduct credits from user in Firestore
        if (effectiveUserId !== 'anonymous' && isFirebaseConfigured()) {
          try {
            const db = getAdminDb();
            const userRef = doc(db, 'users', effectiveUserId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists) {
              const currentCredits = userDoc.data().credits ?? 0;
              const newCredits = Math.max(0, currentCredits - job.images.length);
              await updateDoc(userRef, {
                credits: newCredits,
                updatedAt: serverTimestamp(),
              });
              console.log(`[Generate] Job ${jobId} - deducted ${job.images.length} credits from user ${effectiveUserId}. New balance: ${newCredits}`);
            }
          } catch (creditError) {
            console.error(`[Generate] Job ${jobId} - failed to deduct credits:`, creditError);
          }
        }
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
