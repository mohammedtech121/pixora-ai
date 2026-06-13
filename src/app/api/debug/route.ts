import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const hasHfKey = !!hfKey;
  const hfKeyPreview = hfKey ? `${hfKey.slice(0, 6)}...${hfKey.slice(-4)}` : 'NOT SET';

  // Test HF API
  let hfTestResult = 'not tested';
  if (hasHfKey) {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'a red circle' }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        hfTestResult = `SUCCESS - got image (${response.status})`;
      } else {
        const json = await response.json();
        hfTestResult = `FAIL - status ${response.status}, content-type: ${contentType}, body: ${JSON.stringify(json).slice(0, 300)}`;
      }
    } catch (err: unknown) {
      hfTestResult = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({
    hasHfKey,
    hfKeyPreview,
    hfTestResult,
    nodeVersion: process.version,
  });
}
