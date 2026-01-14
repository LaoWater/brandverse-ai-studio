import { useState } from 'react';
import { Type, ImageIcon, GitMerge } from 'lucide-react';
import { useMediaStudio, VideoGenerationMode } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

const VideoGenerationModeSelector = () => {
  const { videoGenerationMode, setVideoGenerationMode } = useMediaStudio();
  const [hoveredMode, setHoveredMode] = useState<VideoGenerationMode | null>(null);

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
