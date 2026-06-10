'use client';

import { motion } from 'framer-motion';
import { Clock, ArrowRight, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';

export function PromptHistory() {
  const promptHistory = useAppStore((s) => s.promptHistory);
  const setPrompt = useAppStore((s) => s.setPrompt);
  const setSelectedStyle = useAppStore((s) => s.setSelectedStyle);

  const handleReuse = (prompt: string, style: string) => {
    setPrompt(prompt);
    setSelectedStyle(style as 'realistic' | 'anime' | 'cinematic' | '3d' | 'fantasy' | 'cyberpunk' | 'pixar' | 'ghibli');
    document.getElementById('generate')?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <section id="history" className="relative py-20 z-10">
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
              Prompt History
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Revisit and reuse your previous prompts
          </p>
        </motion.div>

        {promptHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="glass-card p-8 text-center max-w-md mx-auto"
          >
            <Clock className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No prompt history yet. Start generating to see your history here.</p>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto glass-card overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {promptHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Time */}
                  <div className="shrink-0 text-xs text-gray-600 w-16">
                    {formatTime(item.timestamp)}
                  </div>

                  {/* Prompt text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{item.prompt}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] uppercase">
                      {item.style}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleReuse(item.prompt, item.style)}
                      className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                      title="Reuse prompt"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-white/[0.04] text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
