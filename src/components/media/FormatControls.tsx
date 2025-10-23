import { Settings2, Maximize2, Sparkles, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, AspectRatio, Quality, VideoDuration } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

const FormatControls = () => {
  const {
    mediaType,
    aspectRatio,
    quality,
    videoDuration,
    setAspectRatio,
    setQuality,
    setVideoDuration,
  } = useMediaStudio();

  const aspectRatios: { value: AspectRatio; label: string; description: string }[] = [
    { value: '1:1', label: '1:1 Square', description: 'Perfect for social media' },
    { value: '16:9', label: '16:9 Landscape', description: 'YouTube, widescreen' },
    { value: '9:16', label: '9:16 Portrait', description: 'TikTok, Instagram Stories' },
    { value: '4:5', label: '4:5 Portrait', description: 'Instagram Feed' },
    { value: '3:2', label: '3:2 Classic', description: 'Photography standard' },
    { value: '4:3', label: '4:3 Standard', description: 'Traditional format' },
  ];

  const qualities: { value: Quality; label: string; credits: number }[] = [
    { value: 'standard', label: 'Standard', credits: 1 },
    { value: 'high', label: 'High', credits: 2 },
    { value: 'ultra', label: 'Ultra', credits: 3 },
  ];

  const durations: { value: VideoDuration; label: string; credits: number }[] = [
    { value: 5, label: '5 seconds', credits: 5 },
    { value: 10, label: '10 seconds', credits: 8 },
    { value: 15, label: '15 seconds', credits: 12 },
    { value: 30, label: '30 seconds', credits: 20 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Settings2 className="w-4 h-4 text-primary" />
        Format Settings
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
            {aspectRatios.map((ratio) => (
              <SelectItem
                key={ratio.value}
                value={ratio.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{ratio.label}</span>
                  <span className="text-xs text-gray-400">{ratio.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quality */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Quality
        </Label>
        <Select value={quality} onValueChange={setQuality}>
          <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {qualities.map((q) => (
              <SelectItem
                key={q.value}
                value={q.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium capitalize">{q.label}</span>
                  <span className="text-xs text-accent ml-4">{q.credits} credits</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video Duration (only for video) */}
      {mediaType === 'video' && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Duration
          </Label>
          <Select value={videoDuration.toString()} onValueChange={(val) => setVideoDuration(parseInt(val) as VideoDuration)}>
            <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/20">
              {durations.map((d) => (
                <SelectItem
                  key={d.value}
                  value={d.value.toString()}
                  className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{d.label}</span>
                    <span className="text-xs text-accent ml-4">{d.credits} credits</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Credit Cost Summary */}
      <div className="pt-4 border-t border-primary/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Estimated Cost:</span>
          <span className="text-accent font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {mediaType === 'video'
              ? durations.find(d => d.value === videoDuration)?.credits || 5
              : qualities.find(q => q.value === quality)?.credits || 2
            } credits
          </span>
        </div>
      </div>
    </div>
  );
};

export default FormatControls;
