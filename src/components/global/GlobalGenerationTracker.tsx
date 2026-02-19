/**
 * GlobalGenerationTracker
 *
 * A global component that tracks BOTH image and video generation progress across all pages.
 * This must be rendered at the App level, inside MediaStudioProvider.
 *
 * Features:
 * - Persists across page navigation
 * - Sets up video polling service callbacks
 * - Tracks image generation progress (no polling - updates come from context)
 * - Shows progress, completion, and error states for both media types
 * - Proper dark/light mode support
 */

import React, { useState, useEffect } from 'react';
import { useMediaStudio, ActiveGeneration, isSoraModel } from '@/contexts/MediaStudioContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { videoPollingService } from '@/services/videoPollingService';
import { Progress } from '@/components/ui/progress';
import {
  Film,
  ImageIcon,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Video,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

// Format elapsed time
const formatElapsedTime = (startedAt: Date): string => {
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

// Truncate prompt for display
const truncatePrompt = (prompt: string, maxLength: number = 35): string => {
  if (prompt.length <= maxLength) return prompt;
  return prompt.slice(0, maxLength) + '...';
};

// Get model display name (supports both video and image models)
const getModelDisplayName = (model: string): string => {
  const modelNames: Record<string, string> = {
    // Video models
    'sora-2': 'Sora 2',
    'sora-2-pro': 'Sora Pro',
    'veo-3.1-generate-001': 'Veo 3.1',
    'veo-3.1-fast-generate-001': 'Veo Fast',
    // Image models
    'gemini-2.5-flash-image': 'Gemini Flash',
    'gemini-3-pro-image-preview': 'Gemini Pro',
    'imagen-4.0-generate-001': 'Imagen 4',
    'gpt-image-1.5': 'GPT Image',
  };
  return modelNames[model] || model;
};

// Get model badge color based on type
const getModelBadgeColor = (model: string, mediaType: 'image' | 'video') => {
  if (mediaType === 'image') {
    if (model.includes('gpt')) return 'bg-green-500/10 text-green-600 dark:text-green-400';
    if (model.includes('imagen')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
  }
  // Video
  if (isSoraModel(model as any)) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
  return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
};

// Get status color classes
const getStatusColors = (status: ActiveGeneration['status']) => {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        icon: 'text-emerald-500',
      };
    case 'failed':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/15',
        border: 'border-red-500/30',
        text: 'text-red-600 dark:text-red-400',
        icon: 'text-red-500',
      };
    default:
      return {
        bg: 'bg-blue-500/5 dark:bg-blue-500/10',
        border: 'border-blue-500/20 dark:border-blue-500/30',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-500',
      };
  }
};

// Single generation item component
const GenerationItem: React.FC<{
  generation: ActiveGeneration;
  onRemove: () => void;
  onViewInLibrary?: () => void;
}> = ({ generation, onRemove, onViewInLibrary }) => {
  const [elapsedTime, setElapsedTime] = useState(formatElapsedTime(generation.startedAt));

  // Update elapsed time every second for active generations
  useEffect(() => {
    if (generation.status === 'completed' || generation.status === 'failed') {
      return;
    }
    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(generation.startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [generation.startedAt, generation.status]);

  const isActive = generation.status === 'starting' || generation.status === 'queued' || generation.status === 'processing';
  const isCompleted = generation.status === 'completed';
  const isFailed = generation.status === 'failed';
  const isImage = generation.mediaType === 'image';
  const colors = getStatusColors(generation.status);

  const MediaIcon = isImage ? ImageIcon : Video;

  return (
    <div className={cn(
      'relative p-3 rounded-xl border transition-all duration-300',
      colors.bg,
      colors.border,
      isActive && 'shadow-sm'
    )}>
      {/* Remove button */}
      {(isCompleted || isFailed) && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Remove"
        >
          <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </button>
      )}

      <div className="flex gap-3">
        {/* Thumbnail or status icon */}
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
          isActive && 'bg-gradient-to-br from-blue-500/20 to-purple-500/20',
          isCompleted && 'bg-emerald-500/20',
          isFailed && 'bg-red-500/20'
        )}>
          {generation.thumbnailUrl ? (
            <img
              src={generation.thumbnailUrl}
              alt="Input"
              className="w-full h-full object-cover"
            />
          ) : isCompleted && isImage && generation.imageUrl ? (
            <img
              src={generation.imageUrl}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          ) : isActive ? (
            <div className="relative">
              <MediaIcon className="w-5 h-5 text-blue-500/60" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          ) : isCompleted ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Prompt - with proper text color */}
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate pr-5">
            {truncatePrompt(generation.prompt)}
          </p>

          {/* Model & specs */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              getModelBadgeColor(generation.model, generation.mediaType)
            )}>
              {getModelDisplayName(generation.model)}
            </span>
            {isImage ? (
              <>
                {generation.aspectRatio && (
                  <>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {generation.aspectRatio}
                    </span>
                  </>
                )}
                {generation.numberOfImages && generation.numberOfImages > 1 && (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {generation.numberOfImages}x
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {generation.duration}s
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {generation.resolution}
                </span>
              </>
            )}
          </div>

          {/* Progress bar for active */}
          {isActive && (
            <div className="mt-2.5">
              <Progress
                value={generation.progress}
                className="h-1.5 bg-gray-200/50 dark:bg-white/10"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {generation.stage}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {elapsedTime}
                </span>
              </div>
            </div>
          )}

          {/* Completed - view button */}
          {isCompleted && (
            <button
              onClick={onViewInLibrary}
              className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              View in Library
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* Error message */}
          {isFailed && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 line-clamp-2">
              {generation.error || 'Generation failed'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main global tracker component
const GlobalGenerationTracker: React.FC = () => {
  const { activeGenerations, updateActiveGeneration, removeActiveGeneration, clearCompletedGenerations } = useMediaStudio();
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Set up video polling service callbacks once on mount
  useEffect(() => {
    console.log('[GlobalGenerationTracker] Setting up video polling callbacks');

    videoPollingService.setCallbacks({
      onProgress: (id, progress, stage) => {
        updateActiveGeneration(id, {
          progress,
          stage,
          status: progress < 30 ? 'queued' : 'processing',
        });
      },
      onComplete: (id, videoUrl, thumbnailUrl) => {
        console.log('[GlobalGenerationTracker] Video generation completed:', id);
        updateActiveGeneration(id, {
          progress: 100,
          status: 'completed',
          stage: 'Complete!',
          videoUrl,
          completedAt: new Date(),
        });

        // Refresh library to show new video
        queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });

        // Show success toast
        toast({
          title: 'Video Ready!',
          description: 'Your video has been generated successfully.',
        });
      },
      onError: (id, error) => {
        console.log('[GlobalGenerationTracker] Video generation error:', id, error);
        updateActiveGeneration(id, {
          status: 'failed',
          stage: 'Failed',
          error,
        });
      },
    });

    // Cleanup on unmount
    return () => {
      console.log('[GlobalGenerationTracker] Cleaning up polling service');
      videoPollingService.stopAll();
    };
  }, [updateActiveGeneration, queryClient, toast]);

  // Calculate counts
  const activeCount = activeGenerations.filter(
    g => g.status === 'starting' || g.status === 'queued' || g.status === 'processing'
  ).length;
  const completedCount = activeGenerations.filter(g => g.status === 'completed').length;
  const failedCount = activeGenerations.filter(g => g.status === 'failed').length;
  const totalCount = activeGenerations.length;

  // Count by media type for header display
  const imageCount = activeGenerations.filter(g => g.mediaType === 'image').length;
  const videoCount = activeGenerations.filter(g => g.mediaType === 'video').length;

  // Auto-expand when new generation starts
  useEffect(() => {
    if (activeCount > 0) {
      setIsExpanded(true);
    }
  }, [activeCount]);

  // Navigate to media studio library view
  const handleViewInLibrary = () => {
    if (location.pathname !== '/media-studio') {
      navigate('/media-studio?view=library');
    } else {
      // Already on media-studio, update the search param to trigger view switch
      navigate('/media-studio?view=library', { replace: true });
    }
  };

  // Don't render if no generations
  if (totalCount === 0) {
    return null;
  }

  // Determine header icon based on what's generating
  const hasImages = imageCount > 0;
  const hasVideos = videoCount > 0;
  const hasBoth = hasImages && hasVideos;

  return (
    <div className="fixed bottom-8 left-4 z-[100]">
      {/* Collapsed state */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg transition-all duration-300',
            'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
            'hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-500/50',
            'hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          {activeCount > 0 ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : completedCount > 0 ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {activeCount > 0 ? (
              <>
                {activeCount} generating
                {completedCount > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    + {completedCount} ready
                  </span>
                )}
              </>
            ) : completedCount > 0 ? (
              `${completedCount} ready`
            ) : (
              `${failedCount} failed`
            )}
          </span>
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
      ) : (
        /* Expanded panel */
        <div className={cn(
          'w-[340px] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300',
          'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
        )}>
          {/* Header */}
          <div className={cn(
            'flex items-center justify-between px-4 py-3',
            'bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-blue-500/10',
            'dark:from-blue-500/15 dark:via-purple-500/10 dark:to-blue-500/15',
            'border-b border-gray-200 dark:border-gray-700/50'
          )}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                {hasBoth ? (
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : hasImages ? (
                  <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Media Generation
              </span>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full animate-pulse">
                  {activeCount} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(completedCount > 0 || failedCount > 0) && (
                <button
                  onClick={clearCompletedGenerations}
                  className="px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Generation items */}
          <div className="p-3 space-y-2.5 max-h-[400px] overflow-y-auto">
            {activeGenerations.map(generation => (
              <GenerationItem
                key={generation.id}
                generation={generation}
                onRemove={() => removeActiveGeneration(generation.id)}
                onViewInLibrary={handleViewInLibrary}
              />
            ))}
          </div>

          {/* Footer */}
          {activeCount > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Continue working - media generates in the background
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalGenerationTracker;
