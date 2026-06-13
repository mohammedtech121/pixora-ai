import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const hasHfKey = !!hfKey;
  const hfKeyPreview = hfKey ? `${hfKey.slice(0, 6)}...${hfKey.slice(-4)}` : 'NOT SET';

  // Test basic internet access
  let internetTest = 'not tested';
  try {
    const resp = await fetch('https://httpbin.org/get', { signal: AbortSignal.timeout(10000) });
    internetTest = `OK - status ${resp.status}`;
  } catch (err: unknown) {
    internetTest = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test HF API with detailed error capture
  let hfTestResult = 'not tested';
  let hfErrorDetail = '';
  if (hasHfKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'a red circle on white background' }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        hfTestResult = `SUCCESS - got image (${response.status})`;
      } else {
        const text = await response.text();
        hfTestResult = `FAIL - status ${response.status}, content-type: ${contentType}`;
        hfErrorDetail = text.slice(0, 500);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        hfTestResult = `ERROR: ${err.name}: ${err.message}`;
        hfErrorDetail = `cause: ${err.cause || 'none'}, stack: ${err.stack?.slice(0, 300) || 'none'}`;
      } else {
        hfTestResult = `ERROR: ${String(err)}`;
      }
    }
  }

  // Test HF API with different URL format
  let hfAltTest = 'not tested';
  try {
    const resp = await fetch('https://huggingface.co/api/models/black-forest-labs/FLUX.1-schnell', {
      signal: AbortSignal.timeout(10000),
    });
    hfAltTest = `OK - status ${resp.status}`;
  } catch (err: unknown) {
    hfAltTest = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    hasHfKey,
    hfKeyPreview,
    internetTest,
    hfTestResult,
    hfErrorDetail,
    hfAltTest,
    nodeVersion: process.version,
  });
}
