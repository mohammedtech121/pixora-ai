'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Maximize2, Trash2, ImageIcon, X, Share2, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { useAppStore, type GeneratedImage } from '@/store/use-app-store';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';

// Download helper — works with both base64 and URL images
async function downloadImage(image: GeneratedImage) {
  try {
    const imageUrl = image.base64
      ? `data:image/png;base64,${image.base64}`
      : image.url || null;

    if (!imageUrl) {
      toast({ title: 'Download failed', description: 'Image URL not available', variant: 'destructive' });
      return;
    }

    // For base64 images, download directly
    if (image.base64) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `pixora-${image.style}-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Downloaded!', description: 'Image saved to your device.' });
      return;
    }

    // For URL images, fetch the blob then download
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `pixora-${image.style}-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast({ title: 'Downloaded!', description: 'Image saved to your device.' });
  } catch (error) {
    console.error('Download error:', error);
    const imageUrl = image.base64
      ? `data:image/png;base64,${image.base64}`
      : image.url;
    if (imageUrl) {
      window.open(imageUrl, '_blank');
      toast({ title: 'Opened in new tab', description: 'Right-click the image to save it.' });
    }
  }
}

function ImageCard({ image, index, onDelete, isDeleting }: { image: GeneratedImage; index: number; onDelete: (id: string) => void; isDeleting: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const styleGradients: Record<string, string> = {
    realistic: 'from-slate-400 via-gray-500 to-zinc-600',
    anime: 'from-pink-500 via-rose-500 to-red-500',
    cinematic: 'from-amber-400 via-orange-500 to-red-500',
    '3d': 'from-emerald-400 via-teal-500 to-cyan-600',
    fantasy: 'from-violet-600 via-purple-500 to-fuchsia-500',
    cyberpunk: 'from-cyan-500 via-blue-500 to-purple-600',
    pixar: 'from-yellow-400 via-amber-500 to-orange-500',
    ghibli: 'from-green-400 via-emerald-500 to-teal-600',
  };

  const imageUrl = image.base64
    ? `data:image/png;base64,${image.base64}`
    : image.url || null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`relative group rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-square relative">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={image.prompt}
              className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(false)}
            />
            {!loaded && (
              <div className={`absolute inset-0 bg-gradient-to-br ${styleGradients[image.style] || 'from-violet-600 to-purple-600'} animate-pulse`} />
            )}
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${styleGradients[image.style] || 'from-violet-600 to-purple-600'} flex items-center justify-center`}>
            <ImageIcon className="w-12 h-12 text-white/30" />
          </div>
        )}

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && !isDeleting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-between p-3"
            >
              <p className="text-xs text-white/80 line-clamp-3 bg-black/40 rounded-lg p-2">
                {image.prompt}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadImage(image); }}
                  className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
                  title="Download image"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="View full size"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image.id);
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 transition-colors ml-auto"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Style badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
          <span className="text-[10px] font-medium text-white/70 uppercase">{image.style}</span>
        </div>

        {/* Quick download button (always visible) */}
        <button
          onClick={(e) => { e.stopPropagation(); downloadImage(image); }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500/30 hover:border-emerald-500/30"
          title="Download"
        >
          <Download className="w-3.5 h-3.5 text-white/70" />
        </button>

        {/* Deleting overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ImageModal({ image, onClose }: { image: GeneratedImage; onClose: () => void }) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const imageUrl = image.base64
    ? `data:image/png;base64,${image.base64}`
    : image.url || null;

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(image.prompt);
    setCopiedPrompt(true);
    toast({ title: 'Copied!', description: 'Prompt copied to clipboard.' });
    setTimeout(() => setCopiedPrompt(false), 2000);
  }, [image.prompt]);

  const handleShare = useCallback(async () => {
    if (navigator.share && imageUrl) {
      try {
        await navigator.share({
          title: 'Check out my AI-generated image on Pixora.ai',
          text: image.prompt,
          url: imageUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyPrompt();
    }
  }, [imageUrl, image.prompt, handleCopyPrompt]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden bg-[#0a0a1a] border border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[70vh] overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={image.prompt} className="w-full h-full object-contain" />
          ) : (
            <div className="w-[600px] h-[400px] bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <ImageIcon className="w-24 h-24 text-white/20" />
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm text-white/90 leading-relaxed">{image.prompt}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] uppercase font-medium">
                {image.style}
              </span>
              <span className="text-xs text-gray-500">{image.size}</span>
              {image.model && (
                <span className="text-xs text-gray-600">via {image.model}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadImage(image)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium text-sm hover:bg-emerald-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Image
            </button>

            <button
              onClick={handleCopyPrompt}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm hover:bg-white/[0.08] transition-all"
            >
              {copiedPrompt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm hover:bg-white/[0.08] transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GallerySection() {
  const {
    generatedImages,
    galleryLoading,
    galleryLoaded,
    setGeneratedImages,
    removeGeneratedImage,
    setGalleryLoading,
  } = useAppStore();

  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Fetch gallery from the server when user logs in
  const fetchGallery = useCallback(async () => {
    if (!user) {
      setGeneratedImages([]);
      return;
    }

    setGalleryLoading(true);
    setGalleryError(null);

    try {
      console.log('[Gallery] Fetching images from server for user:', user.uid);
      const response = await fetch(`/api/gallery?uid=${user.uid}`);

      if (!response.ok) {
        throw new Error(`Failed to load gallery (${response.status})`);
      }

      const data = await response.json();
      console.log(`[Gallery] Loaded ${data.images?.length || 0} images from server`);

      if (data.images && Array.isArray(data.images)) {
        const images: GeneratedImage[] = data.images.map((img: any) => ({
          id: img.id,
          base64: '',
          url: img.url || '',
          prompt: img.prompt || '',
          style: img.style || 'realistic',
          size: img.size || '1024x1024',
          timestamp: img.timestamp || Date.now(),
          model: img.model || '',
          negativePrompt: img.negativePrompt || '',
          userId: img.userId || '',
          createdAt: img.createdAt || '',
        }));
        setGeneratedImages(images);
      }
    } catch (error) {
      console.error('[Gallery] Failed to fetch:', error);
      setGalleryError('Failed to load your gallery. Please try again.');
    } finally {
      setGalleryLoading(false);
    }
  }, [user, setGeneratedImages, setGalleryLoading]);

  // Load gallery on mount and when user changes
  useEffect(() => {
    if (user && !galleryLoaded) {
      fetchGallery();
    } else if (!user) {
      setGeneratedImages([]);
    }
  }, [user, galleryLoaded, fetchGallery, setGeneratedImages]);

  // Refresh gallery when a new image is generated (listen to generatedImages changes)
  // This ensures newly generated images appear immediately
  const prevImageCount = useAppStore((s) => s.generatedImages.length);

  // Delete image from server and local state
  const handleDelete = useCallback(async (id: string) => {
    if (!user || deletingId) return;

    setDeletingId(id);
    console.log(`[Gallery] Deleting image: ${id}`);

    try {
      // Optimistically remove from local state
      removeGeneratedImage(id);

      // Delete from server
      const response = await fetch(`/api/gallery/${id}?uid=${user.uid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Delete failed');
      }

      console.log(`[Gallery] Image ${id} deleted successfully`);
      toast({ title: 'Image deleted', description: 'Image removed from your gallery.' });
    } catch (error) {
      console.error('[Gallery] Delete failed:', error);
      toast({ title: 'Delete failed', description: 'Could not delete the image. Please try again.', variant: 'destructive' });
      // Re-fetch to restore consistency
      fetchGallery();
    } finally {
      setDeletingId(null);
    }
  }, [user, deletingId, removeGeneratedImage, fetchGallery]);

  return (
    <section id="gallery" className="relative py-20 z-10">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Your Gallery
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            All your AI-generated masterpieces in one place — download, share, or remix
          </p>
        </motion.div>

        {/* Loading state */}
        {galleryLoading && !galleryLoaded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center max-w-lg mx-auto"
          >
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Loading your gallery...</h3>
            <p className="text-gray-500 text-sm">Fetching your AI-generated images from the cloud.</p>
          </motion.div>
        ) : galleryError ? (
          /* Error state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center max-w-lg mx-auto"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-red-400/50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Failed to load gallery</h3>
            <p className="text-gray-500 text-sm mb-6">{galleryError}</p>
            <button
              onClick={fetchGallery}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        ) : generatedImages.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center max-w-lg mx-auto"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-violet-400/50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No images yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Your AI-generated images will appear here and persist across sessions. Start by creating your first image!
            </p>
            <a
              href="#generate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all text-sm font-medium"
            >
              <ImageIcon className="w-4 h-4" />
              Create Your First Image
            </a>
          </motion.div>
        ) : (
          /* Gallery grid */
          <div className="space-y-4">
            {/* Refresh button */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{generatedImages.length} image{generatedImages.length !== 1 ? 's' : ''} in your gallery</span>
              <button
                onClick={fetchGallery}
                disabled={galleryLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.08] text-xs transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${galleryLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {generatedImages.map((image, index) => (
                <div key={image.id} onClick={() => setSelectedImage(image)} className="cursor-pointer">
                  <ImageCard
                    image={image}
                    index={index}
                    onDelete={handleDelete}
                    isDeleting={deletingId === image.id}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
