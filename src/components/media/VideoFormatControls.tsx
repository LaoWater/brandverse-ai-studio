import { Settings2, Maximize2, Clock, Monitor, Coins, Volume2, VolumeX, Lock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, VideoAspectRatio, VideoResolution } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const VideoFormatControls = () => {
  const {
    aspectRatio,
    setAspectRatio,
    videoResolution,
    setVideoResolution,
    videoDuration,
    setVideoDuration,
    generateAudio,
    setGenerateAudio,
    selectedVideoModel,
    videoGenerationMode,
    videoReferenceImages,
    sourceVideoGcsUri,
  } = useMediaStudio();

  // Check if we're in extend-video mode (settings are locked)
  const isExtendMode = videoGenerationMode === 'extend-video' && sourceVideoGcsUri;

  // Video aspect ratios - Veo 3.1 ONLY supports 16:9 and 9:16 (NOT 1:1)
  const videoAspectRatios: { value: VideoAspectRatio; label: string; description: string }[] = [
    { value: '9:16', label: '9:16 Portrait', description: 'TikTok, Reels, Stories' },
    { value: '16:9', label: '16:9 Landscape', description: 'YouTube, widescreen' },
  ];

  // Resolution options (official Veo 3.1 param)
  // 1080p and 4k require 8s duration
  const isHighResAllowed = videoDuration === 8;
  const resolutionOptions: { value: VideoResolution; label: string; description: string; disabled?: boolean }[] = [
    { value: '720p', label: '720p HD', description: 'Fast generation, good quality' },
    { value: '1080p', label: '1080p Full HD', description: '8s duration required', disabled: !isHighResAllowed },
    { value: '4k', label: '4K Ultra HD', description: '8s duration required', disabled: !isHighResAllowed },
  ];

  // Duration options (4s, 6s, 8s)
  // 8s required for: reference images, 1080p/4k resolution, or image modes
  const hasReferenceImages = videoReferenceImages.length > 0;
  const isImageMode = videoGenerationMode === 'image-to-video' || videoGenerationMode === 'interpolation';
  const isHighRes = videoResolution === '1080p' || videoResolution === '4k';
  const requires8s = hasReferenceImages || isImageMode || isHighRes;

  const durationOptions: { value: 4 | 6 | 8; label: string; description: string; disabled?: boolean }[] = [
    { value: 4, label: '4 seconds', description: 'Quick clip', disabled: requires8s },
    { value: 6, label: '6 seconds', description: 'Medium clip', disabled: requires8s },
    { value: 8, label: '8 seconds', description: 'Full clip (required for HD/4K)', disabled: false },
  ];

  // Calculate credits based on model and resolution
  // Pricing: Standard ($0.40/s), Fast ($0.15/s)
  // Higher resolutions may have premium pricing
  const getEstimatedCredits = () => {
    const isFast = selectedVideoModel === 'veo-3.1-fast-generate-001';
    let pricePerSecond = isFast ? 0.15 : 0.40;

    // Premium for high resolution
    if (videoResolution === '1080p') pricePerSecond *= 1.5;
    if (videoResolution === '4k') pricePerSecond *= 2;

    const totalCost = pricePerSecond * videoDuration;
    // Convert to credits (assuming 1 credit = $0.01)
    return Math.ceil(totalCost * 100);
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

      {/* Resolution (Veo 3.1 official param) */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" />
          Resolution
          {isExtendMode ? (
            <span className="text-xs text-green-400/80 ml-auto flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Locked for extend
            </span>
          ) : !isHighResAllowed && (
            <span className="text-xs text-yellow-500/80 ml-auto">Set 8s for HD/4K</span>
          )}
        </Label>
        <Select
          value={videoResolution}
          onValueChange={(value) => setVideoResolution(value as VideoResolution)}
          disabled={isExtendMode}
        >
          <SelectTrigger className={`w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors ${isExtendMode ? 'opacity-60 cursor-not-allowed border-green-500/30' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {resolutionOptions.map((res) => (
              <SelectItem
                key={res.value}
                value={res.value}
                disabled={res.disabled}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col py-1">
                  <span className="font-medium text-sm">{res.label}</span>
                  <span className="text-xs text-gray-400">{res.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Output at 24fps (Veo 3.1 standard)</p>
      </div>

      {/* Duration Selector */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Duration
          {isExtendMode ? (
            <span className="text-xs text-green-400/80 ml-auto flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Locked for extend
            </span>
          ) : requires8s && (
            <span className="text-xs text-yellow-500/80 ml-auto">
              {isHighRes ? '8s required for HD/4K' : isImageMode ? '8s required for image mode' : '8s required'}
            </span>
          )}
        </Label>
        <Select
          value={videoDuration.toString()}
          onValueChange={(value) => setVideoDuration(parseInt(value) as 4 | 6 | 8)}
          disabled={requires8s || isExtendMode}
        >
          <SelectTrigger className={`w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isExtendMode ? 'opacity-60 border-green-500/30' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {durationOptions.map((duration) => (
              <SelectItem
                key={duration.value}
                value={duration.value.toString()}
                disabled={duration.disabled}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col py-1">
                  <span className="font-medium text-sm">{duration.label}</span>
                  <span className="text-xs text-gray-400">{duration.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audio Toggle */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          {generateAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          Generate Audio
        </Label>
        <div className="flex items-center justify-between w-full bg-background/50 border-2 border-primary/20 text-white py-3 px-4 rounded-lg">
          <div className="flex flex-col">
            <span className="font-medium text-sm">{generateAudio ? 'Audio Enabled' : 'Audio Disabled'}</span>
            <span className="text-xs text-gray-400">
              {generateAudio ? 'Rich native audio generation' : 'Silent video only'}
            </span>
          </div>
          <Switch
            checked={generateAudio}
            onCheckedChange={setGenerateAudio}
            className="data-[state=checked]:bg-primary"
          />
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
