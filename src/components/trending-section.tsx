'use client';

import { motion } from 'framer-motion';
import { Copy, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { toast } from '@/hooks/use-toast';

const trendingWithImages = [
  {
    id: '1',
    prompt: 'Enchanted library with floating books and magical light',
    style: 'fantasy' as const,
    image: '/gallery/fantasy-library.png',
    useCount: 12840,
  },
  {
    id: '2',
    prompt: 'Cyberpunk samurai standing on a rooftop in the rain',
    style: 'cyberpunk' as const,
    image: '/gallery/cyberpunk-samurai.png',
    useCount: 9523,
  },
  {
    id: '3',
    prompt: 'Dreamy cloudscape with castles in the sky',
    style: 'ghibli' as const,
    image: '/gallery/ghibli-castle.png',
    useCount: 8745,
  },
  {
    id: '4',
    prompt: 'Deep space nebula with crystalline asteroid field',
    style: '3d' as const,
    image: '/gallery/space-nebula.png',
    useCount: 7651,
  },
  {
    id: '5',
    prompt: 'Noir detective in a dimly lit office with rain outside',
    style: 'cinematic' as const,
    image: '/gallery/noir-detective.png',
    useCount: 6892,
  },
  {
    id: '6',
    prompt: 'Cute dragon learning to fly in a meadow',
    style: 'pixar' as const,
    image: '/gallery/pixar-dragon.png',
    useCount: 5434,
  },
];

export function TrendingSection() {
  const setPrompt = useAppStore((s) => s.setPrompt);
  const setSelectedStyle = useAppStore((s) => s.setSelectedStyle);

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({ title: 'Copied!', description: 'Prompt copied to clipboard.' });
  };

  const handleUsePrompt = (prompt: string, style: string) => {
    setPrompt(prompt);
    setSelectedStyle(style as 'realistic' | 'anime' | 'cinematic' | '3d' | 'fantasy' | 'cyberpunk' | 'pixar' | 'ghibli');
    document.getElementById('generate')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 z-10">
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
              Trending Prompts
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Get inspired by the most popular prompts from our community
          </p>
        </motion.div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {trendingWithImages.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="min-w-[280px] md:min-w-0 snap-start"
            >
              <div className="glass-card overflow-hidden h-full flex flex-col hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 group">
                {/* Real preview image */}
                <div className="w-full h-28 relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Style badge on image */}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-violet-300 text-[10px] uppercase font-medium">
                    {item.style}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Prompt text */}
                  <p className="text-sm text-gray-300 line-clamp-2 mb-3 flex-1">{item.prompt}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">{item.useCount.toLocaleString()} uses</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleUsePrompt(item.prompt, item.style)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/20 transition-all"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Use Prompt
                    </button>
                    <button
                      onClick={() => handleCopyPrompt(item.prompt)}
                      className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
