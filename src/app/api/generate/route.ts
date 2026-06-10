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

    const enhancedPrompt = `${stylePrefix}${prompt}${negativePrompt ? `, NOT: ${negativePrompt}` : ''}`;

    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt: enhancedPrompt,
      size: validatedSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440',
    });

    const images = response.data.map((item: { base64?: string; url?: string }, index: number) => ({
      id: `img_${Date.now()}_${index}`,
      base64: item.base64 || '',
      url: item.url || '',
      prompt,
      style: stylePreset,
      size: validatedSize,
      timestamp: Date.now(),
    }));

    return NextResponse.json({ images, creditsUsed: validatedNumImages });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}
