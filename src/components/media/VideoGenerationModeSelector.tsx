import { useState } from 'react';
import { Type, ImageIcon, GitMerge, Play, X, Lock } from 'lucide-react';
import { useMediaStudio, VideoGenerationMode } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const VideoGenerationModeSelector = () => {
  const {
    videoGenerationMode,
    setVideoGenerationMode,
    sourceVideoPreview,
    sourceVideoGcsUri,
    clearSourceVideo,
  } = useMediaStudio();
  const [hoveredMode, setHoveredMode] = useState<VideoGenerationMode | null>(null);

  // Check if we're in extend-video mode
  const isExtendMode = videoGenerationMode === 'extend-video' && sourceVideoGcsUri;

  // Veo 3.1 official modes
  const modes: {
    value: VideoGenerationMode;
    label: string;
    icon: typeof Type;
    description: string;
    disabled?: boolean;
  }[] = [
    {
      value: 'text-to-video',
      label: 'Text',
      icon: Type,
      description: 'Generate video from text prompt',
    },
    {
      value: 'image-to-video',
      label: 'Image',
      icon: ImageIcon,
      description: 'Animate a single input image',
    },
    {
      value: 'interpolation',
      label: 'Morph',
      icon: GitMerge,
      description: 'Smooth transition between two images',
    },
  ];

  // Get the description to show - hovered mode takes priority, then selected mode
  const displayedMode = hoveredMode
    ? modes.find(m => m.value === hoveredMode)
    : modes.find(m => m.value === videoGenerationMode);

  // Handler to exit extend mode and return to text-to-video
  const handleExitExtendMode = () => {
    clearSourceVideo();
    setVideoGenerationMode('text-to-video');
  };

  // If in extend-video mode, show special UI
  if (isExtendMode) {
    return (
      <div className="space-y-3">
        <Label className="text-sm text-gray-400 flex items-center gap-2">
          Generation Mode
          <Badge className="bg-green-500/20 text-green-400 text-[10px] border-0">
            Extend Mode
          </Badge>
        </Label>

        {/* Extend Mode Card */}
        <div className="relative rounded-lg border-2 border-green-500/50 bg-green-500/10 p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-green-400" />
              <span className="font-medium text-sm text-white">Extending Video</span>
              <Badge className="bg-green-600/30 text-green-300 text-[10px] border-0">
                +7s
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitExtendMode}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-red-500/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Preview */}
          {sourceVideoPreview && (
            <div className="relative aspect-video rounded-md overflow-hidden bg-black/50 border border-green-500/30">
              <video
                src={sourceVideoPreview}
                className="w-full h-full object-contain"
                muted
                loop
                autoPlay
                playsInline
              />
              <div className="absolute bottom-1 right-1 bg-black/70 text-[10px] text-green-400 px-1.5 py-0.5 rounded">
                Source Video
              </div>
            </div>
          )}

          {/* Locked Settings Info */}
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/30 rounded px-2 py-1.5">
            <Lock className="w-3 h-3 text-yellow-500/80" />
            <span>720p @ 8s (required for extension)</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 text-center">
          Enter a prompt describing how you want to continue this video
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-400">Generation Mode</Label>
      <div className="grid grid-cols-3 gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = videoGenerationMode === mode.value;
          const isDisabled = mode.disabled;

          return (
            <button
              key={mode.value}
              onClick={() => !isDisabled && setVideoGenerationMode(mode.value)}
              onMouseEnter={() => setHoveredMode(mode.value)}
              onMouseLeave={() => setHoveredMode(null)}
              disabled={isDisabled}
              className={`
                flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg
                border-2 transition-all duration-200
                ${isDisabled
                  ? 'border-gray-700 bg-gray-800/30 text-gray-600 cursor-not-allowed'
                  : isSelected
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-primary/20 bg-background/50 text-gray-400 hover:border-primary/40 hover:text-white'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : isDisabled ? 'text-gray-600' : ''}`} />
              <span className="font-medium text-xs">{mode.label}</span>
            </button>
          );
        })}
      </div>
      {/* Fixed info area below buttons - always same position */}
      <div className="h-5 flex items-center justify-center">
        <p className="text-xs text-gray-400 text-center">
          {displayedMode?.description}
        </p>
      </div>
    </div>
  );
};

export default VideoGenerationModeSelector;
