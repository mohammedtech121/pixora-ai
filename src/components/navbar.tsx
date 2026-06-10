'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, Zap, User } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';

const navLinks = [
  { label: 'Generate', href: '#generate' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Community', href: '#community' },
  { label: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const creditsVal = useAppStore((s) => s.credits);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="glass-strong mx-4 mt-4 rounded-2xl">
        {/* Neon accent line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-violet-400 group-hover:text-violet-300 transition-colors" />
              <div className="absolute inset-0 bg-violet-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-text">
              NeuraCanvas AI
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Credits */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-medium text-gray-300">{creditsVal}</span>
              <span className="text-xs text-gray-500">credits</span>
            </div>

            {/* Profile button */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Profile</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-4 mt-2 glass-strong rounded-2xl overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm text-gray-300">{creditsVal} credits</span>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Profile</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
