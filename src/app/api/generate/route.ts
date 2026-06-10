import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

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

  console.log('[Generate] Request:', { prompt: prompt.slice(0, 50), style: stylePreset, size: validatedSize, numImages: validatedNumImages });

  // Init SDK with timeout
  let zai;
  try {
    zai = await withTimeout(ZAI.create(), 15000);
  } catch (initError) {
    console.error('[Generate] SDK init failed:', initError);
    return NextResponse.json(
      { error: 'AI service initialization failed. Please try again.' },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  let closed = false;

  // Helper: safely enqueue to the stream, return false if stream is closed
  const safeEnqueue = (controller: ReadableStreamDefaultController, data: string): boolean => {
    if (closed) return false;
    try {
      controller.enqueue(encoder.encode(data));
      return true;
    } catch {
      closed = true;
      return false;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Heartbeat to keep proxy alive — sends a comment line every 3 seconds
      const heartbeat = setInterval(() => {
        if (!safeEnqueue(controller, ': heartbeat\n\n')) {
          clearInterval(heartbeat);
        }
      }, 3000);

      try {
        // Signal: connected
        safeEnqueue(controller, `data: ${JSON.stringify({ type: 'progress', status: 'initializing', message: 'Connecting to AI service...' })}\n\n`);

        const images: Array<{
          id: string;
          base64: string;
          url?: string;
          prompt: string;
          style: string;
          size: string;
          timestamp: number;
        }> = [];

        for (let i = 0; i < validatedNumImages; i++) {
          try {
            const statusMsg = validatedNumImages > 1
              ? `Generating image ${i + 1} of ${validatedNumImages}...`
              : 'Creating your image...';

            safeEnqueue(controller, `data: ${JSON.stringify({ type: 'progress', status: 'generating', message: statusMsg, current: i + 1, total: validatedNumImages })}\n\n`);

            console.log(`[Generate] Starting image ${i + 1}/${validatedNumImages}...`);

            const response = await withTimeout(
              zai.images.generations.create({
                prompt: enhancedPrompt,
                size: validatedSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440',
              }),
              80000
            ) as { data?: Array<{ base64?: string; url?: string }> };

            const item = response.data?.[0];
            if (item && (item.base64 || item.url)) {
              const img = {
                id: `img_${Date.now()}_${i}`,
                base64: item.base64 || '',
                url: item.url || '',
                prompt,
                style: stylePreset,
                size: validatedSize,
                timestamp: Date.now(),
              };
              images.push(img);

              // Send image as it's ready
              safeEnqueue(controller, `data: ${JSON.stringify({ type: 'image', data: img })}\n\n`);

              console.log(`[Generate] Image ${i + 1} generated successfully (base64: ${!!item.base64}, url: ${!!item.url})`);
            } else {
              console.error(`[Generate] Image ${i + 1} returned empty data`);
            }
          } catch (imgError) {
            console.error(`[Generate] Image ${i + 1} failed:`, imgError instanceof Error ? imgError.message : imgError);
          }
        }

        clearInterval(heartbeat);

        if (images.length === 0) {
          safeEnqueue(controller, `data: ${JSON.stringify({ type: 'error', error: 'Could not generate images. The AI service may be temporarily busy — please try again.' })}\n\n`);
        } else {
          safeEnqueue(controller, `data: ${JSON.stringify({ type: 'complete', creditsUsed: images.length, totalImages: images.length })}\n\n`);
          console.log('[Generate] Complete:', images.length, 'of', validatedNumImages, 'images');
        }
      } catch (error: unknown) {
        clearInterval(heartbeat);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Generate] Fatal error:', errorMessage);
        safeEnqueue(controller, `data: ${JSON.stringify({ type: 'error', error: `Generation failed: ${errorMessage}` })}\n\n`);
      }

      closed = true;
      try { controller.close(); } catch { /* already closed */ }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
