import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const HF_BASE_URL = 'https://router.huggingface.co/hf-inference/models';

  const logs: string[] = [];

  try {
    // Step 1: Test HF API
    logs.push(`Step 1: HF key present: ${!!hfKey}`);

    if (!hfKey) {
      return NextResponse.json({ error: 'No HF key', logs });
    }

    logs.push('Step 2: Calling HF API...');
    const response = await fetch(`${HF_BASE_URL}/black-forest-labs/FLUX.1-schnell`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: 'a red circle', parameters: { width: 512, height: 512 } }),
      signal: AbortSignal.timeout(55000),
    });

    const contentType = response.headers.get('content-type') || '';
    logs.push(`Step 3: Response status: ${response.status}, content-type: ${contentType}`);

    if (!contentType.includes('image')) {
      const text = await response.text();
      logs.push(`Step 3b: Not image response: ${text.slice(0, 300)}`);
      return NextResponse.json({ error: 'HF API did not return image', logs });
    }

    // Step 2: Get image buffer
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    logs.push(`Step 4: Got image buffer: ${imageBuffer.length} bytes`);

    // Step 3: Try saving
    try {
      const { saveImage } = await import('@/lib/storage');
      const imageId = `debug_${Date.now()}`;
      const imageUrl = await saveImage(imageId, imageBuffer);
      logs.push(`Step 5: Image saved! URL: ${imageUrl}`);
      return NextResponse.json({ success: true, imageUrl, imageSize: imageBuffer.length, logs });
    } catch (saveErr: unknown) {
      logs.push(`Step 5 FAIL: Save error: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);

      // Fallback: Return image as base64 directly
      const base64 = imageBuffer.toString('base64');
      logs.push('Step 6: Returning base64 fallback instead');
      return NextResponse.json({
        success: true,
        imageBase64: base64.slice(0, 100) + '...[truncated]',
        imageSize: imageBuffer.length,
        logs,
        fallbackNote: 'Image storage failed, would need base64 fallback',
      });
    }

  } catch (err: unknown) {
    logs.push(`FATAL: ${err instanceof Error ? err.name + ': ' + err.message : String(err)}`);
    return NextResponse.json({ error: 'Debug test failed', logs }, { status: 500 });
  }
}
