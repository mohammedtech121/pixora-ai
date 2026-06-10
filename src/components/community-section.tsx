'use client';

import { motion } from 'framer-motion';
import { Heart, Bookmark, ImageIcon } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';

export function CommunitySection() {
  const communityImages = useAppStore((s) => s.communityImages);

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
            Explore stunning creations from our community of artists
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]">
          {communityImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-2xl overflow-hidden border border-white/[0.06] group cursor-pointer ${
                index === 0 ? 'md:col-span-2 md:row-span-2' :
                index === 3 ? 'md:col-span-2' :
                index === 5 ? 'md:row-span-2' : ''
              }`}
            >
              {/* Gradient background as placeholder */}
              <div className={`absolute inset-0 bg-gradient-to-br ${image.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />

              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
                }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-white/20" />
              </div>

              {/* Hover overlay with prompt */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100">
                <div>
                  <p className="text-sm text-white/90 font-medium line-clamp-2">{image.prompt}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white/70 uppercase">
                    {image.style}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">@{image.username}</span>
                  <div className="flex items-center gap-2">
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
    </section>
  );
}
