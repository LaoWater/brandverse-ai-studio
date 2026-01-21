import React, { useState, useEffect } from 'react';
import { useMediaStudio, ActiveGeneration } from '@/contexts/MediaStudioContext';
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Film,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
const truncatePrompt = (prompt: string, maxLength: number = 40): string => {
  if (prompt.length <= maxLength) return prompt;
  return prompt.slice(0, maxLength) + '...';
};

// Get model display name
const getModelDisplayName = (model: string): string => {
  const modelNames: Record<string, string> = {
    'sora-2': 'Sora 2',
    'sora-2-pro': 'Sora 2 Pro',
    'veo-3.1-generate-001': 'Veo 3.1',
    'veo-3.1-fast-generate-001': 'Veo Fast',
  };
  return modelNames[model] || model;
};

// Single generation item component
const GenerationItem: React.FC<{
  generation: ActiveGeneration;
  onRemove: () => void;
}> = ({ generation, onRemove }) => {
  const [elapsedTime, setElapsedTime] = useState(formatElapsedTime(generation.startedAt));

  // Update elapsed time every second
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

  return (
    <div className={cn(
      'relative p-3 rounded-lg border transition-all duration-300',
      isActive && 'bg-primary/5 border-primary/30',
      isCompleted && 'bg-green-500/10 border-green-500/30',
      isFailed && 'bg-red-500/10 border-red-500/30'
    )}>
      {/* Remove button for completed/failed */}
      {(isCompleted || isFailed) && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}

      <div className="flex gap-3">
        {/* Thumbnail or placeholder */}
        <div className={cn(
          'w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
          isActive && 'bg-gradient-to-br from-primary/20 to-accent/20',
          isCompleted && 'bg-green-500/20',
          isFailed && 'bg-red-500/20'
        )}>
          {generation.thumbnailUrl ? (
            <img
              src={generation.thumbnailUrl}
              alt="Input"
              className="w-full h-full object-cover"
            />
          ) : isCompleted ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : isFailed ? (
            <AlertCircle className="w-6 h-6 text-red-500" />
          ) : (
            <Film className="w-6 h-6 text-primary/60" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Prompt */}
          <p className="text-sm text-white/90 font-medium truncate pr-6">
            "{truncatePrompt(generation.prompt)}"
          </p>

          {/* Model & specs */}
          <p className="text-xs text-gray-400 mt-0.5">
            {getModelDisplayName(generation.model)} • {generation.duration}s • {generation.resolution}
          </p>

          {/* Progress bar for active */}
          {isActive && (
            <div className="mt-2">
              <Progress
                value={generation.progress}
                className="h-1.5 bg-white/10"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-primary/80">
                  {generation.stage}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {elapsedTime}
                </span>
              </div>
            </div>
          )}

          {/* Completed message */}
          {isCompleted && (
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Ready in your library!
            </p>
          )}

          {/* Error message */}
          {isFailed && (
            <p className="text-xs text-red-400 mt-1 truncate">
              {generation.error || 'Generation failed'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main queue component
const VideoGenerationQueue: React.FC = () => {
  const { activeGenerations, removeActiveGeneration, clearCompletedGenerations } = useMediaStudio();
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();

  const activeCount = activeGenerations.filter(
    g => g.status === 'starting' || g.status === 'queued' || g.status === 'processing'
  ).length;
  const completedCount = activeGenerations.filter(g => g.status === 'completed').length;
  const failedCount = activeGenerations.filter(g => g.status === 'failed').length;

  // Auto-expand when new generation starts
  useEffect(() => {
    if (activeCount > 0) {
      setIsExpanded(true);
    }
  }, [activeCount]);

  // Refresh library when a generation completes
  useEffect(() => {
    if (completedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['mediaLibrary'] });
    }
  }, [completedCount, queryClient]);

  // Don't render if no active generations (must be after all hooks!)
  if (activeGenerations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 video-generation-queue">
      {/* Collapsed state - just a badge */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300',
            'bg-card/95 backdrop-blur-md border border-primary/30 hover:border-primary/50',
            'hover:shadow-primary/20 hover:shadow-xl'
          )}
        >
          {activeCount > 0 ? (
            <Loader className="w-4 h-4 text-primary animate-spin" />
          ) : completedCount > 0 ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm font-medium text-white">
            {activeCount > 0 ? (
              <>
                {activeCount} generating
                {completedCount > 0 && <span className="text-green-400 ml-1">• {completedCount} ready</span>}
              </>
            ) : completedCount > 0 ? (
              `${completedCount} video${completedCount > 1 ? 's' : ''} ready`
            ) : (
              `${failedCount} failed`
            )}
          </span>
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
      ) : (
        /* Expanded state - full panel */
        <div className={cn(
          'w-80 rounded-xl shadow-2xl overflow-hidden transition-all duration-300',
          'bg-card/95 backdrop-blur-md border border-primary/30',
          'video-queue-panel'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">
                Video Generation
              </span>
              {activeCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-full">
                  {activeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(completedCount > 0 || failedCount > 0) && (
                <button
                  onClick={clearCompletedGenerations}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs text-gray-400 hover:text-white"
                  title="Clear completed"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Generation items */}
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {activeGenerations.map(generation => (
              <GenerationItem
                key={generation.id}
                generation={generation}
                onRemove={() => removeActiveGeneration(generation.id)}
              />
            ))}
          </div>

          {/* Footer tip */}
          {activeCount > 0 && (
            <div className="px-4 py-2 border-t border-white/10 bg-white/5">
              <p className="text-xs text-gray-400 text-center">
                You can continue working while videos generate
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoGenerationQueue;
