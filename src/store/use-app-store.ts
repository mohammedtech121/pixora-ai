import { create } from 'zustand';

export type StylePreset = 'realistic' | 'anime' | 'cinematic' | '3d' | 'fantasy' | 'cyberpunk' | 'pixar' | 'ghibli';

export type ImageSize = '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440';

export interface GeneratedImage {
  id: string;
  base64: string;
  url?: string;
  prompt: string;
  style: StylePreset;
  size: ImageSize;
  timestamp: number;
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  style: StylePreset;
  timestamp: number;
}

export interface CommunityImage {
  id: string;
  gradient: string;
  prompt: string;
  style: StylePreset;
  username: string;
  likes: number;
}

export interface TrendingPrompt {
  id: string;
  prompt: string;
  style: StylePreset;
  gradient: string;
  useCount: number;
}

interface AppState {
  // Generation state
  prompt: string;
  negativePrompt: string;
  selectedStyle: StylePreset;
  selectedSize: ImageSize;
  numImages: number;
  isGenerating: boolean;
  generationProgress: number;
  showNegativePrompt: boolean;

  // Gallery
  generatedImages: GeneratedImage[];

  // Prompt history
  promptHistory: PromptHistoryItem[];

  // Credits
  credits: number;

  // UI state
  activeSection: string;

  // Community data (placeholder)
  communityImages: CommunityImage[];
  trendingPrompts: TrendingPrompt[];

  // Actions
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setSelectedStyle: (style: StylePreset) => void;
  setSelectedSize: (size: ImageSize) => void;
  setNumImages: (num: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setShowNegativePrompt: (show: boolean) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  addPromptHistory: (item: PromptHistoryItem) => void;
  setCredits: (credits: number) => void;
  deductCredits: (amount: number) => void;
  setActiveSection: (section: string) => void;
}

const communityPlaceholders: CommunityImage[] = [
  { id: '1', gradient: 'from-violet-600 via-purple-500 to-fuchsia-500', prompt: 'Ethereal forest with bioluminescent trees', style: 'fantasy', username: 'ArtVerse', likes: 2847 },
  { id: '2', gradient: 'from-cyan-500 via-blue-500 to-purple-600', prompt: 'Futuristic Tokyo street at night with neon signs', style: 'cyberpunk', username: 'NeonDreamer', likes: 3215 },
  { id: '3', gradient: 'from-amber-400 via-orange-500 to-red-500', prompt: 'Golden sunset over mountain peaks', style: 'cinematic', username: 'PhotoMaster', likes: 1923 },
  { id: '4', gradient: 'from-emerald-400 via-teal-500 to-cyan-600', prompt: 'Mystical underwater city with crystal towers', style: '3d', username: 'WorldBuilder', likes: 4102 },
  { id: '5', gradient: 'from-pink-500 via-rose-500 to-red-500', prompt: 'Cherry blossom garden with traditional shrine', style: 'ghibli', username: 'AnimeSoul', likes: 2567 },
  { id: '6', gradient: 'from-yellow-400 via-amber-500 to-orange-500', prompt: 'Friendly robot exploring a colorful planet', style: 'pixar', username: 'StoryMaker', likes: 1890 },
  { id: '7', gradient: 'from-indigo-500 via-purple-500 to-pink-500', prompt: 'Portrait of a warrior princess in battle armor', style: 'anime', username: 'MangaPro', likes: 5432 },
  { id: '8', gradient: 'from-slate-400 via-zinc-500 to-gray-700', prompt: 'Hyperrealistic macro shot of morning dew on spider web', style: 'realistic', username: 'LensCraft', likes: 3721 },
];

const trendingPlaceholders: TrendingPrompt[] = [
  { id: '1', prompt: 'Enchanted library with floating books and magical light', style: 'fantasy', gradient: 'from-violet-500 to-purple-600', useCount: 12840 },
  { id: '2', prompt: 'Cyberpunk samurai standing on a rooftop in the rain', style: 'cyberpunk', gradient: 'from-cyan-500 to-blue-600', useCount: 9523 },
  { id: '3', prompt: 'Dreamy cloudscape with castles in the sky', style: 'ghibli', gradient: 'from-pink-500 to-rose-600', useCount: 8745 },
  { id: '4', prompt: 'Deep space nebula with crystalline asteroid field', style: '3d', gradient: 'from-emerald-500 to-teal-600', useCount: 7651 },
  { id: '5', prompt: 'Noir detective in a dimly lit office with rain outside', style: 'cinematic', gradient: 'from-amber-500 to-orange-600', useCount: 6892 },
  { id: '6', prompt: 'Cute dragon learning to fly in a meadow', style: 'pixar', gradient: 'from-yellow-500 to-amber-600', useCount: 5434 },
];

export const useAppStore = create<AppState>((set) => ({
  // Generation state
  prompt: '',
  negativePrompt: '',
  selectedStyle: 'realistic',
  selectedSize: '1024x1024',
  numImages: 1,
  isGenerating: false,
  generationProgress: 0,
  showNegativePrompt: false,

  // Gallery
  generatedImages: [],

  // Prompt history
  promptHistory: [],

  // Credits
  credits: 50,

  // UI state
  activeSection: 'generate',

  // Community data
  communityImages: communityPlaceholders,
  trendingPrompts: trendingPlaceholders,

  // Actions
  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  setSelectedSize: (selectedSize) => set({ selectedSize }),
  setNumImages: (numImages) => set({ numImages }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  setShowNegativePrompt: (showNegativePrompt) => set({ showNegativePrompt }),
  addGeneratedImage: (image) => set((state) => ({
    generatedImages: [image, ...state.generatedImages],
  })),
  addPromptHistory: (item) => set((state) => ({
    promptHistory: [item, ...state.promptHistory].slice(0, 50),
  })),
  setCredits: (credits) => set({ credits }),
  deductCredits: (amount) => set((state) => ({
    credits: Math.max(0, state.credits - amount),
  })),
  setActiveSection: (activeSection) => set({ activeSection }),
}));
