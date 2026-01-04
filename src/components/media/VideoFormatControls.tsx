import { Settings2, Maximize2, Clock, Zap, Coins } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, AspectRatio } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

const VideoFormatControls = () => {
  const {
    aspectRatio,
    setAspectRatio,
    videoFps,
    setVideoFps,
    videoDuration,
    selectedVideoModel,
  } = useMediaStudio();

  // Video aspect ratios (Veo 3.1 supports 16:9, 9:16, 1:1)
  // Ordered by popularity for social media (9:16 first)
  const videoAspectRatios: { value: AspectRatio; label: string; description: string }[] = [
    { value: '9:16', label: '9:16 Portrait', description: 'TikTok, Instagram Stories' },
    { value: '16:9', label: '16:9 Landscape', description: 'YouTube, widescreen' },
    { value: '1:1', label: '1:1 Square', description: 'Social media posts' },
  ];

  // FPS options
  const fpsOptions: { value: 24 | 30; label: string; description: string }[] = [
    { value: 24, label: '24 fps', description: 'Cinematic standard' },
    { value: 30, label: '30 fps', description: 'Smooth motion' },
  ];

  // Calculate credits based on model (placeholder values - adjust as needed)
  const getEstimatedCredits = () => {
    if (selectedVideoModel === 'veo-3.1-fast-generate-001') return 10;
    return 15; // Standard model
  };

  const estimatedCredits = getEstimatedCredits();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Settings2 className="w-4 h-4 text-primary" />
        Video Settings
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5" />
          Aspect Ratio
        </Label>
        <Select value={aspectRatio} onValueChange={setAspectRatio}>
          <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {videoAspectRatios.map((ratio) => (
              <SelectItem
                key={ratio.value}
                value={ratio.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
              >
                <div className="flex flex-col py-1">
                  <span className="font-medium text-sm">{ratio.label}</span>
                  <span className="text-xs text-gray-400">{ratio.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* FPS */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Frame Rate
        </Label>
        <Select
          value={videoFps.toString()}
          onValueChange={(value) => setVideoFps(parseInt(value) as 24 | 30)}
        >
          <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {fpsOptions.map((fps) => (
              <SelectItem
                key={fps.value}
                value={fps.value.toString()}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
              >
                <div className="flex flex-col py-1">
                  <span className="font-medium text-sm">{fps.label}</span>
                  <span className="text-xs text-gray-400">{fps.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration (fixed at 8s for Veo 3.1) */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Duration
        </Label>
        <div className="w-full bg-background/50 border-2 border-primary/20 text-white py-3 px-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">8 seconds</span>
            <span className="text-xs text-gray-400">Veo 3.1 fixed length</span>
          </div>
        </div>
      </div>

      {/* Credit Cost Summary */}
      <div className="pt-4 border-t border-primary/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Estimated Cost:</span>
          <span className="text-accent font-semibold flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            {estimatedCredits} credits
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoFormatControls;
