import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function testUrl(label: string, url: string, method: string = 'GET', headers: Record<string, string> = {}, body?: string) {
  try {
    const resp = await fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();
    return `${label}: status ${resp.status}, type: ${contentType}, body: ${text.slice(0, 200)}`;
  } catch (err: unknown) {
    return `${label}: ERROR - ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function GET() {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const hasHfKey = !!hfKey;

  const results: Record<string, string> = {};

  // Test various HF API endpoint formats
  results['api-inference'] = await testUrl(
    'api-inference',
    'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
    'POST',
    { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs: 'a red circle' })
  );

  results['router'] = await testUrl(
    'router',
    'https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5',
    'POST',
    { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs: 'a red circle' })
  );

  results['inference-direct'] = await testUrl(
    'inference-direct',
    'https://inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
    'POST',
    { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs: 'a red circle' })
  );

  results['huggingface-api'] = await testUrl(
    'huggingface-api',
    'https://huggingface.co/api/models/runwayml/stable-diffusion-v1-5',
  );

  results['huggingface-inference'] = await testUrl(
    'huggingface-inference',
    'https://huggingface.co/api/inference/runwayml/stable-diffusion-v1-5',
  );

  return NextResponse.json({
    hasHfKey,
    results,
    nodeVersion: process.version,
  });
}
