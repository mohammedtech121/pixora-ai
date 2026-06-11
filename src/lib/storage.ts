/**
 * Storage abstraction layer — Firebase Edition
 * - Job Store: Uses Firestore `generation_jobs` collection
 * - Image Storage: Uses Firebase Storage `generated/` folder
 * - Fallback: In-memory job store + local filesystem for dev without Firebase
 */

import { writeFile, readFile, stat, mkdir } from 'fs/promises';
import path from 'path';
import { getAdminDb, getAdminStorage, isFirebaseConfigured } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase-admin/firestore';

// ============ Types ============

interface GenerationJob {
  id: string;
  userId: string;
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

// ============ In-memory fallback (dev mode) ============

const getGlobalStore = (): Map<string, GenerationJob> => {
  if (!(globalThis as Record<string, unknown>).__pixoraJobStore) {
    (globalThis as Record<string, unknown>).__pixoraJobStore = new Map<string, GenerationJob>();
  }
  return (globalThis as Record<string, unknown>).__pixoraJobStore as Map<string, GenerationJob>;
};

// ============ Job Store ============

export async function getJob(jobId: string): Promise<GenerationJob | null> {
  // Try Firestore first (if Firebase is configured)
  if (isFirebaseConfigured()) {
    try {
      const db = getAdminDb();
      const jobDoc = await getDoc(doc(db, 'generation_jobs', jobId));
      if (jobDoc.exists) {
        return jobDoc.data() as GenerationJob;
      }
    } catch (error) {
      console.error('[Storage] Firestore getJob error, falling back to in-memory:', error);
    }
  }

  // In-memory fallback
  return getGlobalStore().get(jobId) || null;
}

export async function setJob(jobId: string, job: GenerationJob): Promise<void> {
  // Save to Firestore (if configured)
  if (isFirebaseConfigured()) {
    try {
      const db = getAdminDb();
      await setDoc(doc(db, 'generation_jobs', jobId), job);
    } catch (error) {
      console.error('[Storage] Firestore setJob error, falling back to in-memory:', error);
    }
  }

  // Always save to in-memory as well (for fallback)
  getGlobalStore().set(jobId, job);

  // Auto-expire old jobs from in-memory store (keep last 100)
  const store = getGlobalStore();
  if (store.size > 100) {
    const entries = Array.from(store.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toDelete = entries.slice(0, entries.length - 100);
    for (const [key] of toDelete) {
      store.delete(key);
    }
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  // Delete from Firestore
  if (isFirebaseConfigured()) {
    try {
      const db = getAdminDb();
      await deleteDoc(doc(db, 'generation_jobs', jobId));
    } catch (error) {
      console.error('[Storage] Firestore deleteJob error:', error);
    }
  }

  // Delete from in-memory
  getGlobalStore().delete(jobId);
}

// ============ Image Storage ============

export async function saveImage(imageId: string, buffer: Buffer): Promise<string> {
  // Try Firebase Storage first (if configured)
  if (isFirebaseConfigured()) {
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const file = bucket.file(`generated/${imageId}.jpg`);

      await file.save(buffer, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            imageId,
            createdAt: new Date().toISOString(),
          },
        },
        public: true, // Make publicly accessible
      });

      // Get the public URL
      const publicUrl = file.publicUrl();
      console.log(`[Storage] Image saved to Firebase Storage: ${imageId}`);
      return publicUrl;
    } catch (error) {
      console.error('[Storage] Firebase Storage save error, falling back to local:', error);
    }
  }

  // Local dev: save to filesystem
  const imagesDir = path.join(process.cwd(), 'generated-images');
  await mkdir(imagesDir, { recursive: true });
  const filePath = path.join(imagesDir, `${imageId}.jpg`);
  await writeFile(filePath, buffer);
  console.log(`[Storage] Image saved locally: ${imageId}`);
  return `/api/image/${imageId}`;
}

export async function getImage(imageId: string): Promise<Buffer | null> {
  // Try Firebase Storage first (if configured)
  if (isFirebaseConfigured()) {
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const file = bucket.file(`generated/${imageId}.jpg`);

      const [exists] = await file.exists();
      if (exists) {
        const [buffer] = await file.download();
        return buffer as Buffer;
      }
    } catch (error) {
      console.error('[Storage] Firebase Storage download error, falling back to local:', error);
    }
  }

  // Local fallback
  const safeId = imageId.replace(/[^a-zA-Z0-9_-]/g, '');
  try {
    const filePath = path.join(process.cwd(), 'generated-images', `${safeId}.jpg`);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return null;
    return await readFile(filePath);
  } catch {
    return null;
  }
}

/**
 * Get the Firebase Storage public URL for an image
 * Returns null if Firebase is not configured
 */
export function getImageUrl(imageId: string): string | null {
  if (isFirebaseConfigured()) {
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const file = bucket.file(`generated/${imageId}.jpg`);
      return file.publicUrl();
    } catch {
      return null;
    }
  }
  return null;
}
