import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for Media Studio
export type MediaType = 'image';

// Image Model Types - Mapped to API model identifiers
export type ImageModel =
  | 'gemini-2.5-flash-image'       // Fast - Gemini 2.5 Flash (Nano Banana)
  | 'imagen-4.0-generate-001'      // Standard - Google Imagen 4
  | 'gpt-image-1.5';               // Ultra - OpenAI GPT Image 1.5

// Quality Tiers - Maps to specific models (kept for backwards compatibility)
export type QualityTier = 'fast' | 'standard' | 'ultra';

// Aspect Ratios - Supported by all models
export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '3:2';

export interface MediaStudioState {
  // Media type selection
  mediaType: MediaType;

  // Model selection - Quality tier determines the model
  qualityTier: QualityTier;
  selectedImageModel: ImageModel;

  // Prompt and reference
  prompt: string;
  referenceImage: File | null;
  referenceImagePreview: string | null;

  // Format settings
  aspectRatio: AspectRatio;

  // Advanced settings (model-specific)
  numberOfImages: number;        // 1-4 for Imagen, 1-10 for GPT-image
  imageSize: '1K' | '2K';        // For Imagen 4 Standard/Ultra
  seed?: number;                 // For reproducible generation (Imagen 4, GPT-image)
  negativePrompt?: string;       // For Imagen 4
  enhancePrompt: boolean;        // For Imagen 4

  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  currentStage: string;

  // Generated media
  generatedMediaUrl: string | null;
  generatedThumbnailUrl: string | null;
}

interface MediaStudioContextType extends MediaStudioState {
  // Setters
  setMediaType: (type: MediaType) => void;
  setQualityTier: (tier: QualityTier) => void;
  setSelectedImageModel: (model: ImageModel) => void;
  setPrompt: (prompt: string) => void;
  setReferenceImage: (file: File | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setNumberOfImages: (num: number) => void;
  setImageSize: (size: '1K' | '2K') => void;
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
}

const MediaStudioContext = createContext<MediaStudioContextType | undefined>(undefined);

const initialState: MediaStudioState = {
  mediaType: 'image',
  qualityTier: 'standard', // Default quality tier
  selectedImageModel: 'gemini-2.5-flash-image', // Default to Gemini (fastest)
  prompt: '',
  referenceImage: null,
  referenceImagePreview: null,
  aspectRatio: '1:1',
  numberOfImages: 1,
  imageSize: '1K',
  seed: undefined,
  negativePrompt: undefined,
  enhancePrompt: true,
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

  const setPrompt = (prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  };

  const setReferenceImage = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({
          ...prev,
          referenceImage: file,
          referenceImagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setState(prev => ({
        ...prev,
        referenceImage: null,
        referenceImagePreview: null,
      }));
    }
  };

  const setAspectRatio = (ratio: AspectRatio) => {
    setState(prev => ({ ...prev, aspectRatio: ratio }));
  };

  const setNumberOfImages = (num: number) => {
    setState(prev => ({ ...prev, numberOfImages: num }));
  };

  const setImageSize = (size: '1K' | '2K') => {
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
    setPrompt,
    setReferenceImage,
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
