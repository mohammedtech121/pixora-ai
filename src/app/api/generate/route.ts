import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

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

// Timeout wrapper for the SDK call
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Generation timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

interface StreamMessage {
  type: 'progress' | 'image' | 'complete' | 'error';
  data?: unknown;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const send = (msg: StreamMessage) => encoder.encode(JSON.stringify(msg) + '\n');

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt, negativePrompt, style, size, numImages } = body;

  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stylePreset = style && STYLE_PRESETS[style] ? style : 'realistic';
  const validatedSize = size && VALID_SIZES.includes(size) ? size : '1024x1024';
  const validatedNumImages = Math.min(Math.max(Number(numImages) || 1, 1), 4);
  const stylePrefix = STYLE_PRESETS[stylePreset] || '';
  const enhancedPrompt = `${stylePrefix}${prompt}${negativePrompt ? `. Avoid: ${negativePrompt}` : ''}`;

  console.log('[Generate] Request:', { prompt: prompt.slice(0, 50), style: stylePreset, size: validatedSize, numImages: validatedNumImages });

  const stream = new ReadableStream({
    async start(controller) {
      const images: Array<{
        id: string;
        base64: string;
        url?: string;
        prompt: string;
        style: string;
        size: string;
        timestamp: number;
      }> = [];

      // Keepalive: send a heartbeat every 5 seconds so proxies don't kill the connection
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(send({ type: 'progress', data: { status: 'heartbeat' } }));
        } catch {
          clearInterval(heartbeat);
        }
      }, 5000);

      try {
        // Init SDK
        controller.enqueue(send({ type: 'progress', data: { status: 'initializing', message: 'Connecting to AI service...' } }));

        let zai;
        try {
          zai = await withTimeout(ZAI.create(), 15000);
        } catch (initError) {
          clearInterval(heartbeat);
          console.error('[Generate] SDK init failed:', initError);
          controller.enqueue(send({
            type: 'error',
            data: { error: 'AI service initialization failed. Please try again.' },
          }));
          controller.close();
          return;
        }

        // Generate images one by one
        for (let i = 0; i < validatedNumImages; i++) {
          try {
            const statusMsg = validatedNumImages > 1
              ? `Generating image ${i + 1} of ${validatedNumImages}...`
              : 'Creating your image...';

            controller.enqueue(send({
              type: 'progress',
              data: { status: 'generating', message: statusMsg, current: i + 1, total: validatedNumImages },
            }));

            console.log(`[Generate] Starting image ${i + 1}/${validatedNumImages}...`);

            const response = await withTimeout(
              zai.images.generations.create({
                prompt: enhancedPrompt,
                size: validatedSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440',
              }),
              80000 // 80 second timeout per image
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

              // Send each image as it's generated so the client can display it immediately
              controller.enqueue(send({ type: 'image', data: img }));

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
          controller.enqueue(send({
            type: 'error',
            data: { error: 'Could not generate images. The AI service may be temporarily busy — please try again.' },
          }));
        } else {
          controller.enqueue(send({
            type: 'complete',
            data: { creditsUsed: images.length, totalImages: images.length },
          }));
          console.log('[Generate] Complete:', images.length, 'of', validatedNumImages, 'images');
        }
      } catch (error: unknown) {
        clearInterval(heartbeat);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Generate] Fatal error:', errorMessage);
        controller.enqueue(send({
          type: 'error',
          data: { error: `Generation failed: ${errorMessage}` },
        }));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
