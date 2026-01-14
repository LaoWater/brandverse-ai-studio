import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for Media Studio
export type MediaType = 'image' | 'video';

// Image Model Types - Mapped to API model identifiers
export type ImageModel =
  | 'gemini-2.5-flash-image'       // Fast - Gemini 2.5 Flash (Nano Banana Standard)
  | 'gemini-3-pro-image-preview'   // Pro - Gemini 3 Pro (Nano Banana Pro)
  | 'imagen-4.0-generate-001'      // Standard - Google Imagen 4
  | 'gpt-image-1.5';               // Ultra - OpenAI GPT Image 1.5

// Video Model Types - Veo 3.1 models
export type VideoModel =
  | 'veo-3.1-generate-001'         // Standard - High-quality production videos
  | 'veo-3.1-fast-generate-001';   // Fast - Rapid iterations, A/B testing

// Video Generation Modes
export type VideoGenerationMode = 'text-to-video' | 'image-to-video' | 'keyframe-to-video';

// Nano Banana Variants
export type NanoBananaVariant = 'standard' | 'pro';

// Quality Tiers - Maps to specific models (kept for backwards compatibility)
export type QualityTier = 'fast' | 'standard' | 'ultra';

// Aspect Ratios - Supported by all models
export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '3:2';

export interface MediaStudioState {
  // Media type selection
  mediaType: MediaType;

  // Image model selection
  qualityTier: QualityTier;
  selectedImageModel: ImageModel;

  // Video model selection
  selectedVideoModel: VideoModel;
  videoGenerationMode: VideoGenerationMode;

  // Nano Banana variant selection
  nanoBananaVariant: NanoBananaVariant;

  // Prompt and reference
  prompt: string;
  referenceImages: File[];              // Multiple reference images (up to 14 for Pro)
  referenceImagePreviews: string[];     // Previews for UI display

  // Format settings
  aspectRatio: AspectRatio;

  // Image-specific settings
  numberOfImages: number;        // 1-4 for Imagen, 1-10 for GPT-image
  imageSize: '1K' | '2K' | '4K'; // For Imagen 4 and Gemini 3 Pro
  seed?: number;                 // For reproducible generation (Imagen 4, GPT-image)
  negativePrompt?: string;       // For Imagen 4
  enhancePrompt: boolean;        // For Imagen 4 - LLM-based prompt rewriting (enabled by default)

  // Video-specific settings
  videoDuration: 4 | 6 | 8;      // Veo 3.1 supports 4, 6, or 8 seconds (8s only with reference images)
  videoFps: 24 | 30;             // 24fps or 30fps
  generateAudio: boolean;        // Generate audio with video (default: true)
  firstFrameImage: File | null;  // For keyframe-to-video mode
  firstFramePreview: string | null;
  lastFrameImage: File | null;   // For keyframe-to-video mode
  lastFramePreview: string | null;
  inputVideoImage: File | null;  // For image-to-video mode (reusing reference image upload)
  inputVideoImagePreview: string | null;

  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  currentStage: string;

  // Generated media
  generatedMediaUrl: string | null;
  generatedThumbnailUrl: string | null;
}

interface MediaStudioContextType extends MediaStudioState {
  // Media type setters
  setMediaType: (type: MediaType) => void;

  // Image model setters
  setQualityTier: (tier: QualityTier) => void;
  setSelectedImageModel: (model: ImageModel) => void;
  setNanoBananaVariant: (variant: NanoBananaVariant) => void;

  // Video model setters
  setSelectedVideoModel: (model: VideoModel) => void;
  setVideoGenerationMode: (mode: VideoGenerationMode) => void;
  setVideoDuration: (duration: 4 | 6 | 8) => void;
  setVideoFps: (fps: 24 | 30) => void;
  setGenerateAudio: (generate: boolean) => void;
  setFirstFrameImage: (file: File | null) => void;
  setLastFrameImage: (file: File | null) => void;
  setInputVideoImage: (file: File | null) => void;
  clearVideoFrames: () => void;

  // Common setters
  setPrompt: (prompt: string) => void;
  addReferenceImage: (file: File) => void;
  removeReferenceImage: (index: number) => void;
  clearReferenceImages: () => void;
  setAspectRatio: (ratio: AspectRatio) => void;

  // Image-specific setters
  setNumberOfImages: (num: number) => void;
  setImageSize: (size: '1K' | '2K' | '4K') => void;
  setSeed: (seed: number | undefined) => void;
  setNegativePrompt: (prompt: string | undefined) => void;
  setEnhancePrompt: (enhance: boolean) => void;

  // Actions
  startGeneration: () => void;
  updateGenerationProgress: (progress: number, stage: string) => void;
  completeGeneration: (mediaUrl: string, thumbnailUrl?: string) => void;
  resetGeneration: () => void;
  clearAll: () => void;

  // Helper function to get model from quality tier
  getModelFromQualityTier: (tier: QualityTier) => ImageModel;

  // Library image loading - fetch image from URL and add to generation
  addReferenceImageFromUrl: (url: string, fileName?: string) => Promise<void>;
  setInputVideoImageFromUrl: (url: string, fileName?: string) => Promise<void>;
}

const MediaStudioContext = createContext<MediaStudioContextType | undefined>(undefined);

const initialState: MediaStudioState = {
  // Media type
  mediaType: 'image',

  // Image models
  qualityTier: 'standard',
  selectedImageModel: 'gemini-2.5-flash-image',
  nanoBananaVariant: 'standard',

  // Video models
  selectedVideoModel: 'veo-3.1-fast-generate-001', // Default to Fast for quicker iterations
  videoGenerationMode: 'text-to-video', // Default mode

  // Common settings
  prompt: '',
  referenceImages: [],
  referenceImagePreviews: [],
  aspectRatio: '9:16', // Default to vertical (social media optimized)

  // Image-specific settings
  numberOfImages: 1,
  imageSize: '1K',
  seed: undefined,
  negativePrompt: undefined,
  enhancePrompt: true,

  // Video-specific settings
  videoDuration: 8,
  videoFps: 24,
  generateAudio: true, // Default to true (generate audio)
  firstFrameImage: null,
  firstFramePreview: null,
  lastFrameImage: null,
  lastFramePreview: null,
  inputVideoImage: null,
  inputVideoImagePreview: null,

  // Generation state
  isGenerating: false,
  generationProgress: 0,
  currentStage: '',
  generatedMediaUrl: null,
  generatedThumbnailUrl: null,
};

// Helper function to map quality tier to model
const getModelFromQualityTierHelper = (tier: QualityTier): ImageModel => {
  switch (tier) {
    case 'fast':
      return 'gemini-2.5-flash-image';      // Nano Banana - Fast & cheap
    case 'standard':
      return 'imagen-4.0-generate-001';     // Imagen 4 - Balanced
    case 'ultra':
      return 'gpt-image-1.5';               // GPT Image 1.5 - Highest quality
    default:
      return 'imagen-4.0-generate-001';
  }
};

export const MediaStudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MediaStudioState>(initialState);

  const setMediaType = (type: MediaType) => {
    setState(prev => ({ ...prev, mediaType: type }));
  };

  const setQualityTier = (tier: QualityTier) => {
    const model = getModelFromQualityTierHelper(tier);
    setState(prev => ({ ...prev, qualityTier: tier, selectedImageModel: model }));
  };

  const setSelectedImageModel = (model: ImageModel) => {
    setState(prev => ({ ...prev, selectedImageModel: model }));
  };

  const setNanoBananaVariant = (variant: NanoBananaVariant) => {
    const model = variant === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    setState(prev => ({
      ...prev,
      nanoBananaVariant: variant,
      selectedImageModel: model,
    }));
  };

  const setPrompt = (prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  };

  const addReferenceImage = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setState(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, file],
        referenceImagePreviews: [...prev.referenceImagePreviews, reader.result as string],
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceImage = (index: number) => {
    setState(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
      referenceImagePreviews: prev.referenceImagePreviews.filter((_, i) => i !== index),
    }));
  };

  const clearReferenceImages = () => {
    setState(prev => ({
      ...prev,
      referenceImages: [],
      referenceImagePreviews: [],
    }));
  };

  const setAspectRatio = (ratio: AspectRatio) => {
    setState(prev => ({ ...prev, aspectRatio: ratio }));
  };

  const setNumberOfImages = (num: number) => {
    setState(prev => ({ ...prev, numberOfImages: num }));
  };

  const setImageSize = (size: '1K' | '2K' | '4K') => {
    setState(prev => ({ ...prev, imageSize: size }));
  };

  const setSeed = (seed: number | undefined) => {
    setState(prev => ({ ...prev, seed }));
  };

  const setNegativePrompt = (prompt: string | undefined) => {
    setState(prev => ({ ...prev, negativePrompt: prompt }));
  };

  const setEnhancePrompt = (enhance: boolean) => {
    setState(prev => ({ ...prev, enhancePrompt: enhance }));
  };

  // Video model setters
  const setSelectedVideoModel = (model: VideoModel) => {
    setState(prev => ({ ...prev, selectedVideoModel: model }));
  };

  const setVideoGenerationMode = (mode: VideoGenerationMode) => {
    setState(prev => ({ ...prev, videoGenerationMode: mode }));
  };

  const setVideoDuration = (duration: 4 | 6 | 8) => {
    setState(prev => ({ ...prev, videoDuration: duration }));
  };

  const setVideoFps = (fps: 24 | 30) => {
    setState(prev => ({ ...prev, videoFps: fps }));
  };

  const setGenerateAudio = (generate: boolean) => {
    setState(prev => ({ ...prev, generateAudio: generate }));
  };

  const setFirstFrameImage = (file: File | null) => {
    if (!file) {
      setState(prev => ({
        ...prev,
        firstFrameImage: null,
        firstFramePreview: null,
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setState(prev => ({
        ...prev,
        firstFrameImage: file,
        firstFramePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const setLastFrameImage = (file: File | null) => {
    if (!file) {
      setState(prev => ({
        ...prev,
        lastFrameImage: null,
        lastFramePreview: null,
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setState(prev => ({
        ...prev,
        lastFrameImage: file,
        lastFramePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const setInputVideoImage = (file: File | null) => {
    if (!file) {
      setState(prev => ({
        ...prev,
        inputVideoImage: null,
        inputVideoImagePreview: null,
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setState(prev => ({
        ...prev,
        inputVideoImage: file,
        inputVideoImagePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearVideoFrames = () => {
    setState(prev => ({
      ...prev,
      firstFrameImage: null,
      firstFramePreview: null,
      lastFrameImage: null,
      lastFramePreview: null,
      inputVideoImage: null,
      inputVideoImagePreview: null,
    }));
  };

  // Fetch image from URL and add as reference image (for image generation)
  const addReferenceImageFromUrl = async (url: string, fileName?: string): Promise<void> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], fileName || 'library-image.png', { type: blob.type });
      addReferenceImage(file);
    } catch (error) {
      console.error('Failed to load image from URL:', error);
      throw error;
    }
  };

  // Fetch image from URL and set as input video image (for image-to-video)
  const setInputVideoImageFromUrl = async (url: string, fileName?: string): Promise<void> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], fileName || 'library-image.png', { type: blob.type });
      setInputVideoImage(file);
    } catch (error) {
      console.error('Failed to load image from URL:', error);
      throw error;
    }
  };

  const startGeneration = () => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      generationProgress: 0,
      currentStage: 'Initializing...',
      generatedMediaUrl: null,
      generatedThumbnailUrl: null,
    }));
  };

  const updateGenerationProgress = (progress: number, stage: string) => {
    setState(prev => ({
      ...prev,
      generationProgress: progress,
      currentStage: stage,
    }));
  };

  const completeGeneration = (mediaUrl: string, thumbnailUrl?: string) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      generationProgress: 100,
      currentStage: 'Complete!',
      generatedMediaUrl: mediaUrl,
      generatedThumbnailUrl: thumbnailUrl || null,
    }));
  };

  const resetGeneration = () => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      generationProgress: 0,
      currentStage: '',
      generatedMediaUrl: null,
      generatedThumbnailUrl: null,
    }));
  };

  const clearAll = () => {
    setState(initialState);
  };

  const getModelFromQualityTier = (tier: QualityTier): ImageModel => {
    return getModelFromQualityTierHelper(tier);
  };

  const value: MediaStudioContextType = {
    ...state,
    setMediaType,
    setQualityTier,
    setSelectedImageModel,
    setNanoBananaVariant,
    setSelectedVideoModel,
    setVideoGenerationMode,
    setVideoDuration,
    setVideoFps,
    setGenerateAudio,
    setFirstFrameImage,
    setLastFrameImage,
    setInputVideoImage,
    clearVideoFrames,
    setPrompt,
    addReferenceImage,
    removeReferenceImage,
    clearReferenceImages,
    setAspectRatio,
    setNumberOfImages,
    setImageSize,
    setSeed,
    setNegativePrompt,
    setEnhancePrompt,
    startGeneration,
    updateGenerationProgress,
    completeGeneration,
    resetGeneration,
    clearAll,
    getModelFromQualityTier,
    addReferenceImageFromUrl,
    setInputVideoImageFromUrl,
  };

  return (
    <MediaStudioContext.Provider value={value}>
      {children}
    </MediaStudioContext.Provider>
  );
};

export const useMediaStudio = (): MediaStudioContextType => {
  const context = useContext(MediaStudioContext);
  if (context === undefined) {
    throw new Error('useMediaStudio must be used within a MediaStudioProvider');
  }
  return context;
};
