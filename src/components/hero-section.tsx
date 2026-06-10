'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Wand2, Image as ImageIcon } from 'lucide-react';

const typingTexts = [
  'A cyberpunk city at sunset with flying cars...',
  'A mystical forest with glowing mushrooms...',
  'An underwater palace with crystal towers...',
  'A steampunk airship above the clouds...',
];

function TypingAnimation() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = typingTexts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % typingTexts.length);
        }
      }
    }, isDeleting ? 30 : 60);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <span className="animate-blink-cursor">
      {typingTexts[textIndex].slice(0, charIndex)}
    </span>
  );
}

const showcaseCards = [
  { gradient: 'from-violet-600 via-purple-500 to-fuchsia-500', label: 'Fantasy', icon: '🏰' },
  { gradient: 'from-cyan-500 via-blue-500 to-indigo-500', label: 'Cyberpunk', icon: '🌆' },
  { gradient: 'from-amber-400 via-orange-500 to-red-500', label: 'Cinematic', icon: '🎬' },
  { gradient: 'from-emerald-400 via-teal-500 to-cyan-600', label: '3D Render', icon: '💎' },
  { gradient: 'from-pink-500 via-rose-500 to-red-500', label: 'Anime', icon: '🌸' },
  { gradient: 'from-yellow-400 via-amber-500 to-orange-500', label: 'Pixar', icon: '✨' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/20 text-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-gray-300">Powered by next-gen AI models</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-medium">NEW</span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Create Anything
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-text">
              You Can Imagine
            </span>
          </motion.h1>

          {/* Subheading with typing animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl min-h-[60px]"
          >
            <TypingAnimation />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <a
              href="#generate"
              className="btn-generate group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Start Creating
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button className="glass-card group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-gray-300 font-semibold text-lg hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>

          {/* Showcase Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="w-full"
          >
            <div className="relative">
              {/* Main showcase grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
                {showcaseCards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group ${
                      i === 0 ? 'md:col-span-2 md:row-span-2 md:aspect-auto' : ''
                    }`}
                  >
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} />

                    {/* Pattern overlay */}
                    <div className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                      }}
                    />

                    {/* Label */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="text-2xl">{card.icon}</span>
                      <span className="text-sm font-medium text-white/90">{card.label}</span>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Glow effect behind cards */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
          >
            {[
              { value: '10M+', label: 'Images Generated' },
              { value: '500K+', label: 'Active Users' },
              { value: '8', label: 'AI Models' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
