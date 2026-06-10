'use client';

import { motion } from 'framer-motion';
import { Copy, TrendingUp, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { toast } from '@/hooks/use-toast';

export function TrendingSection() {
  const trendingPrompts = useAppStore((s) => s.trendingPrompts);
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
          {trendingPrompts.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="min-w-[280px] md:min-w-0 snap-start"
            >
              <div className="glass-card p-5 h-full flex flex-col hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 group">
                {/* Preview gradient */}
                <div className={`w-full h-28 rounded-xl bg-gradient-to-br ${item.gradient} mb-4 opacity-50 group-hover:opacity-70 transition-opacity flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 40% 40%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
                    }}
                  />
                  <TrendingUp className="w-6 h-6 text-white/30" />
                </div>

                {/* Prompt text */}
                <p className="text-sm text-gray-300 line-clamp-2 mb-3 flex-1">{item.prompt}</p>

                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] uppercase font-medium">
                      {item.style}
                    </span>
                    <span className="text-xs text-gray-500">{item.useCount.toLocaleString()} uses</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
