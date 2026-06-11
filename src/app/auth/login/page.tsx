'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName || undefined);
      }
      window.location.href = '/';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      if (message.includes('user-not-found') || message.includes('wrong-password') || message.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (message.includes('email-already-in-use')) {
        setError('This email is already registered. Try logging in instead.');
      } else if (message.includes('weak-password')) {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (message.includes('too-many-requests')) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (message.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, displayName, signIn, signUp]);

  const handleGoogleSignIn = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      window.location.href = '/';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      if (message.includes('popup-closed')) {
        setError('Sign-in popup was closed');
      } else if (message.includes('account-exists')) {
        setError('An account with this email already exists. Try logging in with email/password.');
      } else {
        setError(message);
      }
      setLoading(false);
    }
  }, [signInWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030014] relative overflow-hidden">
      {/* Aurora background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] aurora-blob-1" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/15 blur-[100px] aurora-blob-2" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[80px] aurora-blob-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Sparkles className="w-8 h-8 text-violet-400 group-hover:text-violet-300 transition-colors" />
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-text">
              Pixora.ai
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                {mode === 'login'
                  ? 'Sign in to continue creating amazing AI images'
                  : 'Sign up and get 10 free credits to start generating'}
              </p>

              {/* Free credits badge */}
              {mode === 'signup' && (
                <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm text-amber-300 font-medium">10 free credits on signup</span>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Display Name (signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 btn-generate disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {loading
                    ? (mode === 'login' ? 'Signing In...' : 'Creating Account...')
                    : (mode === 'login' ? 'Sign In' : 'Create Account')
                  }
                </button>
              </form>

              {/* Toggle login/signup */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {mode === 'login' ? (
                    <>Don&apos;t have an account? <span className="text-violet-400 font-medium">Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="text-violet-400 font-medium">Sign in</span></>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-[1px] bg-white/[0.06]" />
                <span className="text-xs text-gray-500">or continue with</span>
                <div className="flex-1 h-[1px] bg-white/[0.06]" />
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-200 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-gray-600 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
