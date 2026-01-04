import { Type, ImageIcon, FrameIcon } from 'lucide-react';
import { useMediaStudio, VideoGenerationMode } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const VideoGenerationModeSelector = () => {
  const { videoGenerationMode, setVideoGenerationMode } = useMediaStudio();

  const modes: {
    value: VideoGenerationMode;
    label: string;
    icon: typeof Type;
    description: string;
  }[] = [
    {
      value: 'text-to-video',
      label: 'Text',
      icon: Type,
      description: 'Generate video from text prompt only',
    },
    {
      value: 'image-to-video',
      label: 'Image',
      icon: ImageIcon,
      description: 'Animate a single input image',
    },
    {
      value: 'keyframe-to-video',
      label: 'Keyframe',
      icon: FrameIcon,
      description: 'Transition between first and last frame',
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-400">Generation Mode</Label>
      <TooltipProvider>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = videoGenerationMode === mode.value;

            return (
              <Tooltip key={mode.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setVideoGenerationMode(mode.value)}
                    className={`
                      flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg
                      border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-primary/20 bg-background/50 text-gray-400 hover:border-primary/40 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : ''}`} />
                    <span className="font-medium text-xs">{mode.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-white/20 text-white">
                  <p className="text-xs">{mode.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default VideoGenerationModeSelector;
