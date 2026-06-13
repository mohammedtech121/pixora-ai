'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, Zap, LogOut, User as UserIcon, CreditCard, Settings } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { label: 'Generate', href: '#generate' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Community', href: '#community' },
  { label: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const creditsVal = useAppStore((s) => s.credits);
  const { user, userData, signOut, loading } = useAuth();

  // Sync credits from auth context to store (only on initial load, not after generation)
  const setCredits = useAppStore((s) => s.setCredits);
  useEffect(() => {
    if (userData?.credits !== undefined) {
      const lastUpdated = useAppStore.getState().creditsLastUpdatedAt;
      // Only override from auth data if we haven't set credits recently
      if (Date.now() - lastUpdated > 5000) {
        setCredits(userData.credits);
      }
    }
  }, [userData?.credits, setCredits]);

  // Fetch credits from API periodically when user is logged in
  // But DON'T overwrite if credits were just updated (e.g., after generation)
  const fetchCredits = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/credits?uid=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (typeof data.credits === 'number') {
          // Only update if credits weren't recently changed locally (within 5s)
          const lastUpdated = useAppStore.getState().creditsLastUpdatedAt;
          if (Date.now() - lastUpdated > 5000) {
            setCredits(data.credits);
          }
        }
      }
    } catch {
      // Silently fail
    }
  }, [user, setCredits]);

  useEffect(() => {
    if (!user) return;
    fetchCredits();
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [user, fetchCredits]);

  const handleSignOut = async () => {
    await signOut();
    setCredits(10);
  };

  const displayName = user?.displayName || userData?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

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
              Pixora.ai
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-all duration-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-medium text-gray-300">{creditsVal}</span>
              <span className="text-xs text-gray-500">credits</span>
            </div>

            {user ? (
              /* User dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
                    <Avatar className="h-6 w-6">
                      {photoURL && <AvatarImage src={photoURL} alt={displayName} />}
                      <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300 max-w-[100px] truncate">{displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0a0a1a] border-white/[0.08]">
                  <DropdownMenuLabel className="text-gray-400">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-white">{displayName}</p>
                      <p className="text-xs text-gray-500">{user?.email || ''}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem className="text-gray-300 focus:text-white focus:bg-white/[0.06] cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 focus:text-white focus:bg-white/[0.06] cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Credits: {creditsVal}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 focus:text-white focus:bg-white/[0.06] cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Sign In button */
              <a
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 hover:border-violet-500/50 transition-all duration-200 text-sm font-medium"
              >
                <UserIcon className="w-4 h-4" />
                Sign In
              </a>
            )}
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
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center gap-1.5 px-4 py-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm text-gray-300">{creditsVal} credits</span>
                </div>
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2">
                      <Avatar className="h-6 w-6">
                        {photoURL && <AvatarImage src={photoURL} alt={displayName} />}
                        <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-300">{displayName}</span>
                    </div>
                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <a
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm text-violet-400 hover:text-violet-300 font-medium"
                  >
                    Sign In
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
