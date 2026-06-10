/**
 * Storage abstraction layer
 * - Dev: uses global in-memory job store + local filesystem for images
 * - Prod (Vercel): uses Vercel Blob for images + Vercel KV for job status
 */

import { writeFile, readFile, stat, mkdir } from 'fs/promises';
import path from 'path';

// ============ Job Store ============

interface GenerationJob {
  id: string;
  status: 'processing' | 'complete' | 'error';
  prompt: string;
  style: string;
  size: string;
  numImages: number;
  images: Array<{
    id: string;
    url: string;
    prompt: string;
    style: string;
    size: string;
    timestamp: number;
  }>;
  error?: string;
  createdAt: number;
}

export type { GenerationJob };

// Use globalThis to persist across HMR and route modules in dev
const getGlobalStore = (): Map<string, GenerationJob> => {
  if (!(globalThis as Record<string, unknown>).__neuraJobStore) {
    (globalThis as Record<string, unknown>).__neuraJobStore = new Map<string, GenerationJob>();
  }
  return (globalThis as Record<string, unknown>).__neuraJobStore as Map<string, GenerationJob>;
};

export async function getJob(jobId: string): Promise<GenerationJob | null> {
  // Try Vercel KV first (prod)
  if (process.env.KV_REST_API_URL) {
    try {
      const { kv } = await import('@vercel/kv');
      const job = await kv.get<GenerationJob>(`job:${jobId}`);
      if (job) return job;
    } catch {
      // Fall through to in-memory
    }
  }

  // In-memory fallback (dev)
  return getGlobalStore().get(jobId) || null;
}

export async function setJob(jobId: string, job: GenerationJob): Promise<void> {
  // Save to Vercel KV (prod)
  if (process.env.KV_REST_API_URL) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(`job:${jobId}`, job, { ex: 3600 }); // Expire after 1 hour
    } catch {
      // Fall through to in-memory
    }
  }

  // Always save to in-memory as well (for dev / fallback)
  getGlobalStore().set(jobId, job);
}

// ============ Image Storage ============

export async function saveImage(imageId: string, buffer: Buffer): Promise<string> {
  // Try Vercel Blob first (prod)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(`generated/${imageId}.jpg`, buffer, {
        access: 'public',
        contentType: 'image/jpeg',
      });
      return blob.url;
    } catch {
      // Fall through to local
    }
  }

  // Local dev: save to filesystem
  const imagesDir = path.join(process.cwd(), 'generated-images');
  await mkdir(imagesDir, { recursive: true });
  const filePath = path.join(imagesDir, `${imageId}.jpg`);
  await writeFile(filePath, buffer);
  return `/api/image/${imageId}`;
}

export async function getImage(imageId: string): Promise<Buffer | null> {
  // Sanitize imageId to prevent directory traversal
  const safeId = imageId.replace(/[^a-zA-Z0-9_-]/g, '');

  // On Vercel Blob, images are served directly from blob URL — this endpoint isn't needed
  // This function is only used for local dev image serving

  try {
    const filePath = path.join(process.cwd(), 'generated-images', `${safeId}.jpg`);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return null;
    return await readFile(filePath);
  } catch {
    return null;
  }
}
