'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Sparkles, ChevronDown, ChevronUp, Loader2,
  Camera, Film, Box, TreePine, Cpu, Palette, Ghost, Wind,
  ImageIcon, Zap, AlertCircle, Check, RotateCcw
} from 'lucide-react';
import { useAppStore, type StylePreset, type ImageSize } from '@/store/use-app-store';
import { toast } from '@/hooks/use-toast';

const styleOptions: { id: StylePreset; label: string; icon: React.ReactNode; gradient: string; desc: string }[] = [
  { id: 'realistic', label: 'Realistic', icon: <Camera className="w-4 h-4" />, gradient: 'from-slate-400 via-gray-500 to-zinc-600', desc: 'Photo-real output' },
  { id: 'anime', label: 'Anime', icon: <Wind className="w-4 h-4" />, gradient: 'from-pink-500 via-rose-500 to-red-500', desc: 'Japanese animation' },
  { id: 'cinematic', label: 'Cinematic', icon: <Film className="w-4 h-4" />, gradient: 'from-amber-400 via-orange-500 to-red-500', desc: 'Movie-like scenes' },
  { id: '3d', label: '3D Render', icon: <Box className="w-4 h-4" />, gradient: 'from-emerald-400 via-teal-500 to-cyan-600', desc: '3D visualization' },
  { id: 'fantasy', label: 'Fantasy', icon: <TreePine className="w-4 h-4" />, gradient: 'from-violet-600 via-purple-500 to-fuchsia-500', desc: 'Magical worlds' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: <Cpu className="w-4 h-4" />, gradient: 'from-cyan-500 via-blue-500 to-purple-600', desc: 'Neon future' },
  { id: 'pixar', label: 'Pixar', icon: <Palette className="w-4 h-4" />, gradient: 'from-yellow-400 via-amber-500 to-orange-500', desc: 'Animated style' },
  { id: 'ghibli', label: 'Ghibli', icon: <Ghost className="w-4 h-4" />, gradient: 'from-green-400 via-emerald-500 to-teal-600', desc: 'Studio magic' },
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
    credits, deductCredits,
    addGeneratedImage, addPromptHistory,
  } = useAppStore();

  const [promptPlaceholder, setPromptPlaceholder] = useState(placeholderPrompts[0]);
  const [enhancing, setEnhancing] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
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
    setGenerationStatus('Connecting to AI...');

    // Create abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Auto-abort after 3 minutes
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 180000);

    // Slow simulated progress — overridden by real SSE progress
    let progressVal = 5;
    progressIntervalRef.current = setInterval(() => {
      progressVal = Math.min(85, progressVal + Math.random() * 1.5);
      setGenerationProgress(progressVal);
    }, 1000);

    let receivedImageCount = 0;
    let hasError = false;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          style: selectedStyle,
          size: selectedSize,
          numImages,
        }),
        signal,
      });

      // Handle non-streaming error responses (400, 503, etc.)
      if (!response.ok) {
        let errorMsg = 'Generation failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      // Process Server-Sent Events stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by double newlines (SSE event boundary)
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          for (const line of lines) {
            // Skip heartbeat comments
            if (line.startsWith(': ')) continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6); // Remove "data: " prefix
            if (!jsonStr.trim()) continue;

            try {
              const msg = JSON.parse(jsonStr);

              if (msg.type === 'progress') {
                if (msg.status === 'initializing') {
                  setGenerationStatus('Connecting to AI service...');
                  setGenerationProgress(10);
                } else if (msg.status === 'generating') {
                  setGenerationStatus(msg.message || 'Creating your image...');
                  if (msg.current && msg.total) {
                    progressVal = 15 + ((msg.current - 1) / msg.total) * 50;
                    setGenerationProgress(progressVal);
                  }
                }
              } else if (msg.type === 'image') {
                receivedImageCount++;
                const img = msg.data;
                if (img && (img.base64 || img.url)) {
                  addGeneratedImage({
                    id: img.id,
                    base64: img.base64 || '',
                    url: img.url || '',
                    prompt: img.prompt,
                    style: img.style as StylePreset,
                    size: img.size as ImageSize,
                    timestamp: img.timestamp,
                  });
                }
                progressVal = 15 + (receivedImageCount / numImages) * 65;
                setGenerationProgress(progressVal);
                setGenerationStatus(
                  numImages > 1
                    ? `Image ${receivedImageCount} of ${numImages} ready!`
                    : 'Image ready!'
                );
              } else if (msg.type === 'complete') {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                setGenerationProgress(100);
                setGenerationStatus('Done!');

                deductCredits(msg.creditsUsed);

                addPromptHistory({
                  id: `ph_${Date.now()}`,
                  prompt,
                  style: selectedStyle,
                  timestamp: Date.now(),
                });

                toast({
                  title: 'Image Generated!',
                  description: `${receivedImageCount} image${receivedImageCount > 1 ? 's' : ''} created successfully.`,
                });

                setTimeout(() => {
                  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
                }, 600);

              } else if (msg.type === 'error') {
                hasError = true;
                toast({
                  title: 'Generation Failed',
                  description: msg.error || 'Something went wrong. Please try again.',
                  variant: 'destructive',
                });
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      if (receivedImageCount === 0 && !hasError) {
        toast({
          title: 'Generation Failed',
          description: 'No images were generated. Please try again.',
          variant: 'destructive',
        });
      }

    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast({
          title: 'Generation Timed Out',
          description: 'The AI service took too long. Please try again — sometimes a shorter prompt works faster.',
          variant: 'destructive',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
        toast({
          title: 'Generation Failed',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      clearTimeout(timeoutId);
      cleanupGeneration();
    }
  }, [prompt, negativePrompt, selectedStyle, selectedSize, numImages, credits, addGeneratedImage, addPromptHistory, deductCredits, cleanupGeneration, setIsGenerating, setGenerationProgress]);

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
              onClick={() => setShowNegativePrompt(!showNegativePrompt)}
              className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showNegativePrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Negative Prompt
            </button>

            <AnimatePresence>
              {showNegativePrompt && (
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
            <label className="text-sm font-medium text-gray-300 mb-4 block">Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {styleOptions.map((style) => (
                <motion.button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isGenerating}
                  className={`relative p-3 rounded-xl border transition-all duration-200 text-left group disabled:opacity-50 ${
                    selectedStyle === style.id
                      ? 'border-violet-500/50 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${style.gradient} mb-2 opacity-60 group-hover:opacity-80 transition-opacity`} />
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{style.icon}</span>
                    <span className="text-xs font-medium text-gray-300">{style.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{style.desc}</span>
                  {selectedStyle === style.id && (
                    <motion.div
                      layoutId="style-indicator"
                      className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
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
              <label className="text-sm font-medium text-gray-300 mb-4 block">Size</label>
              <div className="grid grid-cols-3 gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    disabled={isGenerating}
                    className={`p-2.5 rounded-xl border transition-all duration-200 text-center disabled:opacity-50 ${
                      selectedSize === size.id
                        ? 'border-violet-500/50 bg-violet-500/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1.5">
                      <div
                        className={`border border-current rounded-sm ${
                          selectedSize === size.id ? 'text-violet-400' : 'text-gray-500'
                        }`}
                        style={{
                          width: size.id === '768x1344' || size.id === '864x1152' ? 12 : size.id === '1344x768' || size.id === '1440x720' ? 24 : 18,
                          height: size.id === '768x1344' || size.id === '720x1440' ? 24 : size.id === '1344x768' || size.id === '1440x720' ? 12 : 18,
                        }}
                      />
                    </div>
                    <div className={`text-xs font-medium ${selectedSize === size.id ? 'text-violet-300' : 'text-gray-400'}`}>
                      {size.label}
                    </div>
                    <div className="text-[10px] text-gray-500">{size.aspect}</div>
                  </button>
                ))}
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
                  <button
                    key={n}
                    onClick={() => setNumImages(n)}
                    disabled={isGenerating}
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
                  </button>
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
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || credits < numImages}
                className="btn-generate w-full py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
              >
                <Wand2 className="w-5 h-5" />
                <span>Generate {numImages} Image{numImages > 1 ? 's' : ''}</span>
                <span className="text-white/60 text-sm">({numImages} credit{numImages > 1 ? 's' : ''})</span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Generating state */}
                <button
                  onClick={handleCancel}
                  className="w-full py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                >
                  <div className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  <div className="flex flex-col items-center">
                    <span>{generationStatus || 'Generating...'}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{Math.round(generationProgress)}% · Click to cancel</span>
                  </div>
                </button>
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
      </div>
    </section>
  );
}
