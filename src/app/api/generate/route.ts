import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const images = [];
    let zai;

    try {
      zai = await withTimeout(ZAI.create(), 10000);
    } catch (initError) {
      console.error('[Generate] SDK init failed:', initError);
      return NextResponse.json(
        { error: 'AI service initialization failed. Please try again.' },
        { status: 503 }
      );
    }

    for (let i = 0; i < validatedNumImages; i++) {
      try {
        console.log(`[Generate] Starting image ${i + 1}/${validatedNumImages}...`);

        const response = await withTimeout(
          zai.images.generations.create({
            prompt: enhancedPrompt,
            size: validatedSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440',
          }),
          80000 // 80 second timeout per image
        );

        const item = response.data?.[0];
        if (item && (item.base64 || item.url)) {
          images.push({
            id: `img_${Date.now()}_${i}`,
            base64: item.base64 || '',
            url: item.url || '',
            prompt,
            style: stylePreset,
            size: validatedSize,
            timestamp: Date.now(),
          });
          console.log(`[Generate] Image ${i + 1} generated successfully (base64: ${!!item.base64}, url: ${!!item.url})`);
        } else {
          console.error(`[Generate] Image ${i + 1} returned empty data`);
        }
      } catch (imgError) {
        console.error(`[Generate] Image ${i + 1} failed:`, imgError instanceof Error ? imgError.message : imgError);
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate images. The AI service may be temporarily busy — please try again in a moment.' },
        { status: 500 }
      );
    }

    console.log('[Generate] Complete:', images.length, 'of', validatedNumImages, 'images');
    return NextResponse.json({ images, creditsUsed: images.length });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Generate] Fatal error:', errorMessage);
    return NextResponse.json(
      { error: `Generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
