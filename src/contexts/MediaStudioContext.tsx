import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for Media Studio
export type MediaType = 'video' | 'image';
export type VideoModel = 'veo-3.1' | 'sora-2';
export type ImageModel = 'imagen-4';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '3:2' | '4:3';
export type Quality = 'standard' | 'high' | 'ultra';
export type VideoDuration = 5 | 10 | 15 | 30;

export interface MediaStudioState {
  // Media type selection
  mediaType: MediaType;

  // Model selection
  selectedVideoModel: VideoModel;
  selectedImageModel: ImageModel;

  // Prompt and reference
  prompt: string;
  referenceImage: File | null;
  referenceImagePreview: string | null;

  // Format settings
  aspectRatio: AspectRatio;
  quality: Quality;
  videoDuration: VideoDuration;

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
  setSelectedVideoModel: (model: VideoModel) => void;
  setSelectedImageModel: (model: ImageModel) => void;
  setPrompt: (prompt: string) => void;
  setReferenceImage: (file: File | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setQuality: (quality: Quality) => void;
  setVideoDuration: (duration: VideoDuration) => void;

  // Actions
  startGeneration: () => void;
  updateGenerationProgress: (progress: number, stage: string) => void;
  completeGeneration: (mediaUrl: string, thumbnailUrl?: string) => void;
  resetGeneration: () => void;
  clearAll: () => void;
}

const MediaStudioContext = createContext<MediaStudioContextType | undefined>(undefined);

const initialState: MediaStudioState = {
  mediaType: 'image',
  selectedVideoModel: 'veo-3.1',
  selectedImageModel: 'imagen-4',
  prompt: '',
  referenceImage: null,
  referenceImagePreview: null,
  aspectRatio: '1:1',
  quality: 'high',
  videoDuration: 5,
  isGenerating: false,
  generationProgress: 0,
  currentStage: '',
  generatedMediaUrl: null,
  generatedThumbnailUrl: null,
};

export const MediaStudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MediaStudioState>(initialState);

  const setMediaType = (type: MediaType) => {
    setState(prev => ({ ...prev, mediaType: type }));
  };

  const setSelectedVideoModel = (model: VideoModel) => {
    setState(prev => ({ ...prev, selectedVideoModel: model }));
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

  const setQuality = (quality: Quality) => {
    setState(prev => ({ ...prev, quality }));
  };

  const setVideoDuration = (duration: VideoDuration) => {
    setState(prev => ({ ...prev, videoDuration: duration }));
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

  const value: MediaStudioContextType = {
    ...state,
    setMediaType,
    setSelectedVideoModel,
    setSelectedImageModel,
    setPrompt,
    setReferenceImage,
    setAspectRatio,
    setQuality,
    setVideoDuration,
    startGeneration,
    updateGenerationProgress,
    completeGeneration,
    resetGeneration,
    clearAll,
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
