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

// Video Generation Modes (Veo 3.1 official)
export type VideoGenerationMode = 'text-to-video' | 'image-to-video' | 'interpolation' | 'extend-video';

// Video Resolution (Veo 3.1 official)
export type VideoResolution = '720p' | '1080p' | '4k';

// Nano Banana Variants
export type NanoBananaVariant = 'standard' | 'pro';

// Quality Tiers - Maps to specific models (kept for backwards compatibility)
export type QualityTier = 'fast' | 'standard' | 'ultra';

// Aspect Ratios - Image supports all, Video only 16:9 and 9:16
export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '3:2';
export type VideoAspectRatio = '16:9' | '9:16'; // Veo 3.1 only supports these two

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

  // Video-specific settings (Veo 3.1 official params)
  videoDuration: 4 | 6 | 8;      // 8s required for 1080p/4k, reference images, or extension
  videoResolution: VideoResolution; // 720p (default), 1080p, 4k; 720p ONLY for extension
  generateAudio: boolean;        // Generate audio with video (default: true)
  videoNegativePrompt?: string;  // Describes what NOT to include in the video
  firstFrameImage: File | null;  // For interpolation mode (start frame)
  firstFramePreview: string | null;
  lastFrameImage: File | null;   // For interpolation mode (end frame)
  lastFramePreview: string | null;
  inputVideoImage: File | null;  // For image-to-video mode
  inputVideoImagePreview: string | null;
  videoReferenceImages: File[];  // Up to 3 style/content reference images (Veo 3.1 exclusive)
  videoReferenceImagePreviews: string[];
  // For extend-video mode - Continues a Veo-generated video (~7s extension)
  sourceVideoGcsUri: string | null; // GCS URI of the video to extend (valid for 2 days)
  sourceVideoPreview: string | null; // Preview URL for UI display

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

  // Video model setters (Veo 3.1)
  setSelectedVideoModel: (model: VideoModel) => void;
  setVideoGenerationMode: (mode: VideoGenerationMode) => void;
  setVideoDuration: (duration: 4 | 6 | 8) => void;
  setVideoResolution: (resolution: VideoResolution) => void;
  setGenerateAudio: (generate: boolean) => void;
  setVideoNegativePrompt: (prompt: string | undefined) => void;
  setFirstFrameImage: (file: File | null) => void;
  setLastFrameImage: (file: File | null) => void;
  setInputVideoImage: (file: File | null) => void;
  addVideoReferenceImage: (file: File) => void;
  removeVideoReferenceImage: (index: number) => void;
  clearVideoReferenceImages: () => void;
  clearVideoFrames: () => void;
  // For extend-video mode
  setSourceVideoForExtension: (gcsUri: string, previewUrl: string) => void;
  clearSourceVideo: () => void;

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

  // Video-specific settings (Veo 3.1 official params)
  videoDuration: 8,
  videoResolution: '720p', // Default to 720p
  generateAudio: true, // Default to true (generate audio)
  videoNegativePrompt: undefined,
  firstFrameImage: null,
  firstFramePreview: null,
  lastFrameImage: null,
  lastFramePreview: null,
  inputVideoImage: null,
  inputVideoImagePreview: null,
  videoReferenceImages: [],
  videoReferenceImagePreviews: [],
  sourceVideoGcsUri: null,
  sourceVideoPreview: null,

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

  const setVideoResolution = (resolution: VideoResolution) => {
    setState(prev => ({ ...prev, videoResolution: resolution }));
  };

  const setGenerateAudio = (generate: boolean) => {
    setState(prev => ({ ...prev, generateAudio: generate }));
  };

  const setVideoNegativePrompt = (prompt: string | undefined) => {
    setState(prev => ({ ...prev, videoNegativePrompt: prompt }));
  };

  const addVideoReferenceImage = (file: File) => {
    // Limit to 3 reference images for Veo 3.1
    if (state.videoReferenceImages.length >= 3) {
      console.warn('Maximum 3 reference images allowed for Veo 3.1');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setState(prev => ({
        ...prev,
        videoReferenceImages: [...prev.videoReferenceImages, file],
        videoReferenceImagePreviews: [...prev.videoReferenceImagePreviews, reader.result as string],
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeVideoReferenceImage = (index: number) => {
    setState(prev => ({
      ...prev,
      videoReferenceImages: prev.videoReferenceImages.filter((_, i) => i !== index),
      videoReferenceImagePreviews: prev.videoReferenceImagePreviews.filter((_, i) => i !== index),
    }));
  };

  const clearVideoReferenceImages = () => {
    setState(prev => ({
      ...prev,
      videoReferenceImages: [],
      videoReferenceImagePreviews: [],
    }));
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
      videoReferenceImages: [],
      videoReferenceImagePreviews: [],
      videoNegativePrompt: undefined,
      sourceVideoGcsUri: null,
      sourceVideoPreview: null,
    }));
  };

  // Set source video for extend-video mode
  const setSourceVideoForExtension = (gcsUri: string, previewUrl: string) => {
    setState(prev => ({
      ...prev,
      sourceVideoGcsUri: gcsUri,
      sourceVideoPreview: previewUrl,
      videoGenerationMode: 'extend-video',
      // Extension requires 720p and 8s
      videoResolution: '720p',
      videoDuration: 8,
    }));
  };

  const clearSourceVideo = () => {
    setState(prev => ({
      ...prev,
      sourceVideoGcsUri: null,
      sourceVideoPreview: null,
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
    setVideoResolution,
    setGenerateAudio,
    setVideoNegativePrompt,
    setFirstFrameImage,
    setLastFrameImage,
    setInputVideoImage,
    addVideoReferenceImage,
    removeVideoReferenceImage,
    clearVideoReferenceImages,
    clearVideoFrames,
    setSourceVideoForExtension,
    clearSourceVideo,
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
