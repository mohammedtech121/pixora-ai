'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bookmark, Download, X, Copy, Check, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const galleryImages = [
  {
    id: '1',
    src: '/gallery/fantasy-library.png',
    prompt: 'Enchanted library with floating books and magical golden light',
    style: 'Fantasy',
    username: 'ArtVerse',
    likes: 2847,
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    id: '2',
    src: '/gallery/cyberpunk-samurai.png',
    prompt: 'Cyberpunk samurai standing on a rooftop in the rain',
    style: 'Cyberpunk',
    username: 'NeonDreamer',
    likes: 3215,
    span: '',
  },
  {
    id: '3',
    src: '/gallery/ghibli-castle.png',
    prompt: 'Dreamy cloudscape with castles in the sky',
    style: 'Ghibli',
    username: 'AnimeSoul',
    likes: 2567,
    span: '',
  },
  {
    id: '4',
    src: '/gallery/space-nebula.png',
    prompt: 'Deep space nebula with crystalline asteroid field',
    style: '3D',
    username: 'WorldBuilder',
    likes: 4102,
    span: 'md:col-span-2',
  },
  {
    id: '5',
    src: '/gallery/noir-detective.png',
    prompt: 'Noir detective in a dimly lit office with rain outside',
    style: 'Cinematic',
    username: 'PhotoMaster',
    likes: 1923,
    span: '',
  },
  {
    id: '6',
    src: '/gallery/pixar-dragon.png',
    prompt: 'Cute baby dragon learning to fly in a meadow',
    style: 'Pixar',
    username: 'StoryMaker',
    likes: 1890,
    span: 'md:row-span-2',
  },
  {
    id: '7',
    src: '/gallery/macro-dew.png',
    prompt: 'Hyperrealistic macro shot of morning dew on spider web',
    style: 'Realistic',
    username: 'LensCraft',
    likes: 3721,
    span: '',
  },
  {
    id: '8',
    src: '/gallery/anime-warrior.png',
    prompt: 'Anime warrior princess in ornate battle armor',
    style: 'Anime',
    username: 'MangaPro',
    likes: 5432,
    span: '',
  },
];

// Download helper for community images
async function downloadCommunityImage(src: string, style: string, id: string) {
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error('Failed to fetch');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `pixora-${style}-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast({ title: 'Downloaded!', description: 'Image saved to your device.' });
  } catch {
    // Fallback: open in new tab
    window.open(src, '_blank');
    toast({ title: 'Opened in new tab', description: 'Right-click the image to save it.' });
  }
}

function CommunityImageModal({ image, onClose }: { image: typeof galleryImages[0]; onClose: () => void }) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(image.prompt);
    setCopiedPrompt(true);
    toast({ title: 'Copied!', description: 'Prompt copied to clipboard.' });
    setTimeout(() => setCopiedPrompt(false), 2000);
  }, [image.prompt]);

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
        {/* Image */}
        <div className="relative max-h-[65vh] overflow-hidden">
          <img src={image.src} alt={image.prompt} className="w-full h-full object-contain" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Bottom panel */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm text-white/90 leading-relaxed">{image.prompt}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] uppercase font-medium">
                {image.style}
              </span>
              <span className="text-xs text-gray-500">by @{image.username}</span>
              <span className="text-xs text-gray-500">· {image.likes.toLocaleString()} likes</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCommunityImage(image.src, image.style, image.id)}
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

export function CommunitySection() {
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);

  return (
    <section id="community" className="relative py-20 z-10">
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
              Community Showcase
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Explore stunning creations from our community of artists — click to download or copy prompts
          </p>
        </motion.div>

        {/* Bento grid with real images */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedImage(image)}
              className={`relative rounded-2xl overflow-hidden border border-white/[0.06] group cursor-pointer ${image.span}`}
            >
              {/* Real AI-generated image */}
              <img
                src={image.src}
                alt={image.prompt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Subtle gradient overlay at bottom for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Hover overlay with prompt and download */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div>
                  <p className="text-sm text-white/90 font-medium line-clamp-2">{image.prompt}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white/70 uppercase">
                    {image.style}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">@{image.username}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadCommunityImage(image.src, image.style, image.id); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-emerald-300">Save</span>
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                      <Heart className="w-3 h-3 text-white/70" />
                      <span className="text-xs text-white/70">{image.likes}</span>
                    </button>
                    <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                      <Bookmark className="w-3 h-3 text-white/70" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full image modal */}
      <AnimatePresence>
        {selectedImage && (
          <CommunityImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
