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

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, style, size, numImages } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const stylePreset = style && STYLE_PRESETS[style] ? style : 'realistic';
    const validatedSize = size && VALID_SIZES.includes(size) ? size : '1024x1024';
    const validatedNumImages = Math.min(Math.max(Number(numImages) || 1, 1), 4);
    const stylePrefix = STYLE_PRESETS[stylePreset] || '';

    const enhancedPrompt = `${stylePrefix}${prompt}${negativePrompt ? `. Avoid: ${negativePrompt}` : ''}`;

    console.log('[Generate] Starting generation:', { prompt: prompt.slice(0, 50), style: stylePreset, size: validatedSize, numImages: validatedNumImages });

    // Generate images - the SDK generates 1 image per call, so we call it multiple times for multiple images
    const images = [];
    const zai = await ZAI.create();

    for (let i = 0; i < validatedNumImages; i++) {
      try {
        const response = await zai.images.generations.create({
          prompt: enhancedPrompt,
          size: validatedSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440',
        });

        const item = response.data[0];
        if (item) {
          images.push({
            id: `img_${Date.now()}_${i}`,
            base64: item.base64 || '',
            url: item.url || '',
            prompt,
            style: stylePreset,
            size: validatedSize,
            timestamp: Date.now(),
          });
        }
      } catch (imgError) {
        console.error(`[Generate] Image ${i + 1} failed:`, imgError);
        // Continue generating other images even if one fails
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images. The AI service may be temporarily unavailable. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[Generate] Success:', images.length, 'images generated');
    return NextResponse.json({ images, creditsUsed: images.length });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Generate] Fatal error:', errorMessage);
    return NextResponse.json(
      { error: `Failed to generate image: ${errorMessage}. Please try again.` },
      { status: 500 }
    );
  }
}
