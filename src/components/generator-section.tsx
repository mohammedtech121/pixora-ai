'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Sparkles, ChevronDown, ChevronUp, Loader2,
  Camera, Film, Box, TreePine, Cpu, Palette, Ghost, Wind,
  ImageIcon, Zap, AlertCircle, Check, RotateCcw, Lock, LogIn
} from 'lucide-react';
import { useAppStore, type StylePreset, type ImageSize } from '@/store/use-app-store';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';

const FREE_STYLES: StylePreset[] = ['realistic', 'anime', 'cinematic', '3d'];
const FREE_SIZE: ImageSize = '1024x1024';

const styleOptions: { id: StylePreset; label: string; icon: React.ReactNode; gradient: string; desc: string; premium: boolean; preview: string }[] = [
  { id: 'realistic', label: 'Realistic', icon: <Camera className="w-4 h-4" />, gradient: 'from-slate-400 via-gray-500 to-zinc-600', desc: 'Photo-real output', premium: false, preview: '/styles/realistic.png' },
  { id: 'anime', label: 'Anime', icon: <Wind className="w-4 h-4" />, gradient: 'from-pink-500 via-rose-500 to-red-500', desc: 'Japanese animation', premium: false, preview: '/styles/anime.png' },
  { id: 'cinematic', label: 'Cinematic', icon: <Film className="w-4 h-4" />, gradient: 'from-amber-400 via-orange-500 to-red-500', desc: 'Movie-like scenes', premium: false, preview: '/styles/cinematic.png' },
  { id: '3d', label: '3D Render', icon: <Box className="w-4 h-4" />, gradient: 'from-emerald-400 via-teal-500 to-cyan-600', desc: '3D visualization', premium: false, preview: '/styles/3d.png' },
  { id: 'fantasy', label: 'Fantasy', icon: <TreePine className="w-4 h-4" />, gradient: 'from-violet-600 via-purple-500 to-fuchsia-500', desc: 'Magical worlds', premium: true, preview: '/styles/fantasy.png' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: <Cpu className="w-4 h-4" />, gradient: 'from-cyan-500 via-blue-500 to-purple-600', desc: 'Neon future', premium: true, preview: '/styles/cyberpunk.png' },
  { id: 'pixar', label: 'Pixar', icon: <Palette className="w-4 h-4" />, gradient: 'from-yellow-400 via-amber-500 to-orange-500', desc: 'Animated style', premium: true, preview: '/styles/pixar.png' },
  { id: 'ghibli', label: 'Ghibli', icon: <Ghost className="w-4 h-4" />, gradient: 'from-green-400 via-emerald-500 to-teal-600', desc: 'Studio magic', premium: true, preview: '/styles/ghibli.png' },
];

const sizeOptions: { id: ImageSize; label: string; aspect: string; desc: string }[] = [
  { id: '1024x1024', label: '1:1', aspect: 'Square', desc: '1024×1024' },
  { id: '768x1344', label: '9:16', aspect: 'Portrait', desc: '768×1344' },
  { id: '1344x768', label: '16:9', aspect: 'Landscape', desc: '1344×768' },
  { id: '1152x864', label: '4:3', aspect: 'Classic', desc: '1152×864' },
  { id: '864x1152', label: '3:4', aspect: 'Portrait', desc: '864×1152' },
  { id: '1440x720', label: '2:1', aspect: 'Wide', desc: '1440×720' },
];

const placeholderPrompts = [
  'A serene Japanese garden at sunset with cherry blossoms falling...',
  'A futuristic cityscape with flying vehicles and neon holograms...',
  'A mystical dragon perched on a crystal mountain peak...',
];

const negativePromptTags = ['blurry', 'low quality', 'distorted', 'watermark', 'text', 'deformed', 'bad anatomy', 'extra limbs'];

export function GeneratorSection() {
  const {
    prompt, setPrompt,
    negativePrompt, setNegativePrompt,
    selectedStyle, setSelectedStyle,
    selectedSize, setSelectedSize,
    numImages, setNumImages,
    isGenerating, setIsGenerating,
    generationProgress, setGenerationProgress,
    showNegativePrompt, setShowNegativePrompt,
    credits, setCredits, deductCredits,
    addGeneratedImage, addPromptHistory,
  } = useAppStore();

  const { user, userData, loading: authLoading } = useAuth();

  const [promptPlaceholder, setPromptPlaceholder] = useState(placeholderPrompts[0]);
  const [enhancing, setEnhancing] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isGeneratingRef = useRef(false);

  // Cycle placeholder text
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % placeholderPrompts.length;
      setPromptPlaceholder(placeholderPrompts[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Fetch credits from server when user changes
  useEffect(() => {
    if (user) {
      fetch(`/api/credits?uid=${user.uid}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.credits !== undefined && typeof data.credits === 'number') {
            // Only update on initial load (creditsLastUpdatedAt === 0)
            const lastUpdated = useAppStore.getState().creditsLastUpdatedAt;
            if (lastUpdated === 0) {
              setCredits(data.credits);
            }
          }
        })
        .catch(() => {});
    }
  }, [user, setCredits]);

  const handleRippleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 700);
  }, []);

  const handleEnhance = useCallback(async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    await new Promise((r) => setTimeout(r, 1500));
    const enhancements: Record<StylePreset, string> = {
      realistic: ', ultra detailed, 8k resolution, professional photography, soft bokeh',
      anime: ', vibrant colors, dynamic pose, detailed linework, dramatic composition',
      cinematic: ', dramatic lighting, depth of field, volumetric fog, anamorphic lens',
      '3d': ', studio lighting, subsurface scattering, ambient occlusion, ray tracing',
      fantasy: ', ethereal glow, magical particles, intricate details, dreamy atmosphere',
      cyberpunk: ', neon reflections, rain-slicked streets, holographic displays, moody',
      pixar: ', soft shadows, warm lighting, expressive features, playful composition',
      ghibli: ', watercolor textures, gentle gradients, warm palette, whimsical feel',
    };
    setPrompt(prompt + (enhancements[selectedStyle] || ', highly detailed, masterpiece'));
    setEnhancing(false);
    toast({ title: 'Prompt Enhanced!', description: 'AI has improved your prompt with style-specific keywords.' });
  }, [prompt, selectedStyle, setPrompt]);

  const handleAddNegTag = useCallback((tag: string) => {
    if (negativePrompt.includes(tag)) return;
    setNegativePrompt(negativePrompt ? `${negativePrompt}, ${tag}` : tag);
  }, [negativePrompt, setNegativePrompt]);

  const cleanupGeneration = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    isGeneratingRef.current = false;
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('');
    }, 500);
  }, [setIsGenerating, setGenerationProgress]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: 'Enter a prompt', description: 'Please describe what you want to create.', variant: 'destructive' });
      return;
    }
    if (credits < numImages) {
      toast({ title: 'Not enough credits', description: 'You need more credits to generate images.', variant: 'destructive' });
      return;
    }

    // Prevent double-generation
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationStatus('Starting generation...');

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    let cancelled = false;

    // Auto-cancel after 3 minutes
    const timeoutId = setTimeout(() => {
      cancelled = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 180000);

    // Animate progress while polling
    let progressVal = 5;
    progressIntervalRef.current = setInterval(() => {
      if (progressVal < 90) {
        progressVal += Math.random() * 1.2;
        setGenerationProgress(progressVal);
      }
      // Cycle status messages
      if (progressVal > 10 && progressVal < 25) setGenerationStatus('Understanding your prompt...');
      else if (progressVal >= 25 && progressVal < 45) setGenerationStatus('Creating composition...');
      else if (progressVal >= 45 && progressVal < 65) setGenerationStatus('Rendering details...');
      else if (progressVal >= 65 && progressVal < 85) setGenerationStatus('Finalizing image...');
      else if (progressVal >= 85) setGenerationStatus('Almost there...');
    }, 800);

    try {
      // Send generation request (synchronous — server generates and returns images)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          style: selectedStyle,
          size: selectedSize,
          numImages,
          userId: user?.uid || 'anonymous',
        }),
        signal,
      });

      if (!response.ok) {
        let errorMsg = 'Generation failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Handle synchronous response with images
      if (data.status === 'complete' && data.images && data.images.length > 0) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setGenerationProgress(100);
        setGenerationStatus('Done!');

        const imageCount = data.images.length;

        // Add all generated images to gallery
        for (const img of data.images) {
          addGeneratedImage({
            id: img.id,
            base64: '',
            url: img.url,
            prompt: img.prompt,
            style: img.style as StylePreset,
            size: img.size as ImageSize,
            timestamp: img.timestamp,
          });
        }

        // Update credits from server response (source of truth)
        if (data.creditsRemaining !== undefined && data.creditsRemaining !== null) {
          // Server returned the authoritative credit count after deduction
          setCredits(data.creditsRemaining);
        } else {
          // Fallback: deduct locally and then sync from server
          deductCredits(imageCount);
          if (user) {
            // Fetch real credits from server after a short delay for Firestore propagation
            setTimeout(async () => {
              try {
                const creditsRes = await fetch(`/api/credits?uid=${user.uid}`);
                if (creditsRes.ok) {
                  const creditsData = await creditsRes.json();
                  if (typeof creditsData.credits === 'number') {
                    setCredits(creditsData.credits);
                  }
                }
              } catch {}
            }, 2000);
          }
        }

        // Calculate display credits for toast
        const displayCredits = data.creditsRemaining !== undefined && data.creditsRemaining !== null
          ? data.creditsRemaining
          : Math.max(0, credits - imageCount);

        addPromptHistory({
          id: `ph_${Date.now()}`,
          prompt,
          style: selectedStyle,
          timestamp: Date.now(),
        });

        toast({
          title: 'Image Generated!',
          description: `${imageCount} image${imageCount > 1 ? 's' : ''} created. ${displayCredits} credits remaining.`,
        });

        setTimeout(() => {
          document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
        }, 600);

      } else if (data.status === 'error') {
        throw new Error(data.error || 'Generation failed. Please try again.');
      } else {
        throw new Error('No images were generated. Please try again.');
      }
    } catch (error: unknown) {
      if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) {
        toast({
          title: 'Generation Timed Out',
          description: 'The AI service took too long. Please try again.',
          variant: 'destructive',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
        // Check if it's an upgrade-required error
        const isUpgradeError = message.includes('Upgrade to unlock') || message.includes('requires a Starter or Pro plan');
        toast({
          title: isUpgradeError ? 'Upgrade Required' : 'Generation Failed',
          description: isUpgradeError ? message + ' Visit Pricing to upgrade your plan.' : message,
          variant: 'destructive',
        });
      }
    } finally {
      clearTimeout(timeoutId);
      cleanupGeneration();
    }
  }, [prompt, negativePrompt, selectedStyle, selectedSize, numImages, credits, user, addGeneratedImage, addPromptHistory, deductCredits, cleanupGeneration, setIsGenerating, setGenerationProgress, setCredits]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cleanupGeneration();
    toast({ title: 'Generation Cancelled', description: 'Image generation was cancelled.' });
  }, [cleanupGeneration]);

  return (
    <section id="generate" className="relative py-20 z-10">
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
              AI Image Studio
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Describe your vision and watch it come to life with our state-of-the-art AI models
          </p>
        </motion.div>

        {/* Auth gate: show sign-in prompt if not logged in */}
        {!user && !authLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Sign In to Start Creating</h3>
              <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
                Join Pixora.ai with your email or Google account and get 10 free credits to generate stunning AI images.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-generate text-white font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In with Email
                </a>
                <a
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:text-white font-medium text-sm transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Get 10 Free Credits
                </a>
              </div>
            </div>
          </motion.div>
        ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Prompt Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Describe your image
              </label>
              <span className="text-xs text-gray-500">{prompt.length}/1000</span>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                placeholder={promptPlaceholder}
                rows={4}
                disabled={isGenerating}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none transition-all text-sm leading-relaxed disabled:opacity-50"
              />
              <button
                onClick={handleEnhance}
                disabled={!prompt.trim() || enhancing || isGenerating}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium hover:bg-violet-500/30 hover:border-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {enhancing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                {enhancing ? 'Enhancing...' : 'Enhance'}
              </button>
            </div>

            {/* Negative Prompt Toggle */}
            <button
              onClick={() => {
                if (userData?.plan === 'free' || !userData?.plan) {
                  toast({
                    title: 'Premium Feature',
                    description: 'Negative prompts require Starter or Pro plan. Upgrade to unlock this feature.',
                    variant: 'destructive',
                  });
                  return;
                }
                setShowNegativePrompt(!showNegativePrompt);
              }}
              className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showNegativePrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Negative Prompt
              {(userData?.plan === 'free' || !userData?.plan) && (
                <Lock className="w-3 h-3 text-amber-400/60" />
              )}
            </button>

            <AnimatePresence>
              {showNegativePrompt && (userData?.plan !== 'free' && userData?.plan) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Things to avoid in the image..."
                    rows={2}
                    disabled={isGenerating}
                    className="mt-3 w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 resize-none transition-all text-sm disabled:opacity-50"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {negativePromptTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddNegTag(tag)}
                        disabled={isGenerating}
                        className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400/70 text-xs hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-40"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Style Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6"
          >
            <label className="text-sm font-medium text-gray-300 mb-4 block flex items-center gap-2">
              Style
              {(userData?.plan === 'free' || !userData?.plan) && (
                <span className="text-[10px] text-violet-400/70 bg-violet-500/10 px-2 py-0.5 rounded-full">4 of 8 on Free</span>
              )}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {styleOptions.map((style) => {
                const isPremium = style.premium && (userData?.plan === 'free' || !userData?.plan);
                return (
                  <motion.button
                    key={style.id}
                    onClick={() => {
                      if (isPremium) {
                        toast({
                          title: 'Premium Style',
                          description: `"${style.label}" requires Starter or Pro plan. Upgrade to unlock all styles.`,
                          variant: 'destructive',
                        });
                        return;
                      }
                      setSelectedStyle(style.id);
                    }}
                    whileHover={{ scale: isPremium ? 1 : 1.02 }}
                    whileTap={{ scale: isPremium ? 1 : 0.98 }}
                    disabled={isGenerating}
                    className={`relative p-3 rounded-xl border transition-all duration-200 text-left group disabled:opacity-50 ${
                      isPremium
                        ? 'border-amber-500/20 bg-amber-500/[0.03] cursor-not-allowed'
                        : selectedStyle === style.id
                          ? 'border-violet-500/50 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="w-full h-12 rounded-lg mb-2 overflow-hidden relative">
                    <img
                      src={style.preview}
                      alt={style.label}
                      className={`w-full h-full object-cover ${isPremium ? 'opacity-20 grayscale' : 'opacity-70 group-hover:opacity-90'} transition-all duration-200`}
                    />
                    {!isPremium && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}
                  </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`${isPremium ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-300'} transition-colors`}>{style.icon}</span>
                      <span className={`text-xs font-medium ${isPremium ? 'text-gray-500' : 'text-gray-300'}`}>{style.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{style.desc}</span>
                    {isPremium && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                      </div>
                    )}
                    {selectedStyle === style.id && !isPremium && (
                      <motion.div
                        layoutId="style-indicator"
                        className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center"
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Size & Count Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Size Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card p-6"
            >
              <label className="text-sm font-medium text-gray-300 mb-4 block flex items-center gap-2">
                Size
                {(userData?.plan === 'free' || !userData?.plan) && (
                  <span className="text-[10px] text-violet-400/70 bg-violet-500/10 px-2 py-0.5 rounded-full">1:1 only on Free</span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {sizeOptions.map((size) => {
                  const isPremiumSize = size.id !== FREE_SIZE && (userData?.plan === 'free' || !userData?.plan);
                  return (
                    <motion.button
                      key={size.id}
                      onClick={() => {
                        if (isPremiumSize) {
                          toast({
                            title: 'Premium Resolution',
                            description: `${size.aspect} (${size.desc}) requires Starter or Pro plan. Upgrade to unlock all resolutions.`,
                            variant: 'destructive',
                          });
                          return;
                        }
                        setSelectedSize(size.id);
                      }}
                      disabled={isGenerating}
                      whileHover={{ scale: isPremiumSize ? 1 : 1.05 }}
                      whileTap={{ scale: isPremiumSize ? 1 : 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={`relative p-2.5 rounded-xl border transition-all duration-200 text-center disabled:opacity-50 ${
                        isPremiumSize
                          ? 'border-amber-500/20 bg-amber-500/[0.03] cursor-not-allowed'
                          : selectedSize === size.id
                            ? 'border-violet-500/50 bg-violet-500/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1.5">
                        <div
                          className={`border border-current rounded-sm ${isPremiumSize ? 'text-gray-700' : selectedSize === size.id ? 'text-violet-400' : 'text-gray-500'}`}
                          style={{
                            width: size.id === '768x1344' || size.id === '864x1152' ? 12 : size.id === '1344x768' || size.id === '1440x720' ? 24 : 18,
                            height: size.id === '768x1344' || size.id === '720x1440' ? 24 : size.id === '1344x768' || size.id === '1440x720' ? 12 : 18,
                          }}
                        />
                      </div>
                      <div className={`text-xs font-medium ${isPremiumSize ? 'text-gray-600' : selectedSize === size.id ? 'text-violet-300' : 'text-gray-400'}`}>
                        {size.label}
                      </div>
                      <div className="text-[10px] text-gray-500">{size.aspect}</div>
                      {isPremiumSize && (
                        <Lock className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-amber-400/60" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Number of Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="glass-card p-6"
            >
              <label className="text-sm font-medium text-gray-300 mb-4 block">Number of Images</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <motion.button
                    key={n}
                    onClick={() => setNumImages(n)}
                    disabled={isGenerating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center disabled:opacity-50 ${
                      numImages === n
                        ? 'border-violet-500/50 bg-violet-500/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className={`grid gap-0.5 mb-2 ${n === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {Array.from({ length: n }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-sm ${
                            numImages === n ? 'bg-violet-500/50' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${numImages === n ? 'text-violet-300' : 'text-gray-400'}`}>
                      {n}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Credits info */}
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-300">
                  This will use {numImages} credit{numImages > 1 ? 's' : ''} · You have <strong>{credits}</strong> remaining
                </span>
              </div>
            </motion.div>
          </div>

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {!isGenerating ? (
              <motion.button
                onClick={(e) => { handleRippleClick(e); handleGenerate(); }}
                disabled={!prompt.trim() || credits < numImages}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="btn-generate w-full py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden group"
              >
                {/* Ripple effects */}
                {ripples.map(ripple => (
                  <span
                    key={ripple.id}
                    className="btn-ripple"
                    style={{ left: ripple.x - 10, top: ripple.y - 10, width: 20, height: 20 }}
                  />
                ))}
                {/* Hover effect layer */}
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity duration-100" />
                </span>
                <Wand2 className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Generate {numImages} Image{numImages > 1 ? 's' : ''}</span>
                <span className="text-white/60 text-sm relative z-10">({numImages} credit{numImages > 1 ? 's' : ''})</span>
              </motion.button>
            ) : (
              <div className="space-y-3">
                {/* Generating state */}
                <motion.button
                  onClick={handleCancel}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15"
                >
                  {/* Animated progress bar */}
                  <div className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 transition-all duration-500 rounded-full"
                    style={{ width: `${generationProgress}%` }}
                  />
                  {/* Glow effect on progress */}
                  <div className="absolute bottom-0 left-0 h-1.5 transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  >
                    <div className="absolute right-0 -top-1 w-8 h-4 bg-violet-500/30 blur-md rounded-full" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <span className="text-violet-200">{generationStatus || 'Generating...'}</span>
                    <span className="text-xs text-violet-400/60 mt-0.5">{Math.round(generationProgress)}% · Click to cancel</span>
                  </div>
                </motion.button>
                <p className="text-center text-xs text-gray-600">
                  AI generation typically takes 30-60 seconds. Please be patient.
                </p>
              </div>
            )}

            {credits < numImages && !isGenerating && (
              <div className="mt-2 flex items-center gap-2 justify-center text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                Not enough credits
              </div>
            )}
          </motion.div>
        </div>
        )}
      </div>
    </section>
  );
}
