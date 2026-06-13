import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function testUrl(label: string, url: string, method: string = 'GET', headers: Record<string, string> = {}, body?: string) {
  try {
    const resp = await fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    });
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();
    return `${label}: status ${resp.status}, type: ${contentType}, body: ${text.slice(0, 300)}`;
  } catch (err: unknown) {
    return `${label}: ERROR - ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function GET() {
  const hfKey = process.env.HUGGINGFACE_API_KEY!;

  const results: Record<string, string> = {};

  // Test router with FLUX.1-schnell
  results['router-flux'] = await testUrl(
    'router-flux',
    'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
    'POST',
    { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs: 'a red circle on white background' })
  );

  // Test router with SDXL
  results['router-sdxl'] = await testUrl(
    'router-sdxl',
    'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
    'POST',
    { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs: 'a red circle on white background' })
  );

  // Test router with FLUX and parameters
  results['router-flux-params'] = await testUrl(
    'router-flux-params',
    'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
    'POST',
    { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs: 'a red circle on white background', parameters: { width: 512, height: 512 } })
  );

  return NextResponse.json({ results });
}
