'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Maximize2, RefreshCw, Wand2, Trash2, ImageIcon, X } from 'lucide-react';
import { useAppStore, type GeneratedImage } from '@/store/use-app-store';

function ImageCard({ image, index }: { image: GeneratedImage; index: number }) {
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

  // Support both base64 and url responses from the API
  const imageUrl = image.base64
    ? `data:image/png;base64,${image.base64}`
    : image.url || null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative group rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]"
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
          {hovered && (
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
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Upscale"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Variations"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Remix"
                >
                  <Wand2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ml-auto"
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
      </div>
    </motion.div>
  );
}

function ImageModal({ image, onClose }: { image: GeneratedImage; onClose: () => void }) {
  const imageUrl = image.base64
    ? `data:image/png;base64,${image.base64}`
    : image.url || null;

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
        className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={image.prompt} className="w-full h-full object-contain" />
        ) : (
          <div className="w-[600px] h-[600px] bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <ImageIcon className="w-24 h-24 text-white/20" />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-sm text-white/90">{image.prompt}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-violet-300 uppercase">{image.style}</span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{image.size}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GallerySection() {
  const generatedImages = useAppStore((s) => s.generatedImages);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

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
            All your AI-generated masterpieces in one place
          </p>
        </motion.div>

        {generatedImages.length === 0 ? (
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
              Your AI-generated images will appear here. Start by creating your first image above!
            </p>
            <a
              href="#generate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all text-sm font-medium"
            >
              <Wand2 className="w-4 h-4" />
              Create Your First Image
            </a>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {generatedImages.map((image, index) => (
              <div key={image.id} onClick={() => setSelectedImage(image)} className="cursor-pointer">
                <ImageCard image={image} index={index} />
              </div>
            ))}
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
