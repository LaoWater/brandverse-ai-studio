import { Type, ImageIcon, GitMerge, Film } from 'lucide-react';
import { useMediaStudio, VideoGenerationMode } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const VideoGenerationModeSelector = () => {
  const { videoGenerationMode, setVideoGenerationMode, sourceVideoGcsUri } = useMediaStudio();

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
    {
      value: 'extend-video',
      label: 'Extend',
      icon: Film,
      description: sourceVideoGcsUri
        ? 'Continue this video (+7s)'
        : 'Extend a video (select from library)',
      disabled: !sourceVideoGcsUri, // Only enabled when a source video is selected
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-400">Generation Mode</Label>
      <TooltipProvider>
        <div className="grid grid-cols-4 gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = videoGenerationMode === mode.value;
            const isDisabled = mode.disabled;

            return (
              <Tooltip key={mode.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isDisabled && setVideoGenerationMode(mode.value)}
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
