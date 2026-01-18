import { Monitor, Clock, ImageIcon, Shuffle, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMediaStudio, SoraResolution, isSoraModel } from '@/contexts/MediaStudioContext';

interface ResolutionOption {
  value: SoraResolution;
  label: string;
  aspectRatio: string;
  description: string;
}

const SoraFormatControls = () => {
  const {
    selectedVideoModel,
    soraResolution,
    setSoraResolution,
    soraDuration,
    setSoraDuration,
    videoGenerationMode,
    setVideoGenerationMode,
    // Sora image-to-video uses the shared inputVideoImage field (handled by KeyframeImageUpload)
    soraRemixVideoId,
    soraRemixVideoPreview,
    clearSoraRemixVideo,
  } = useMediaStudio();

  // Only show for Sora models
  if (!isSoraModel(selectedVideoModel)) {
    return null;
  }

  const isPro = selectedVideoModel === 'sora-2-pro';

  // Both Sora 2 and Sora 2 Pro: 4s, 8s, 12s (default 4s)
  const durationOptions = [
    { value: 4, label: '4s' },
    { value: 8, label: '8s' },
    { value: 12, label: '12s' },
  ];

  // Sora 2: only 720p resolutions
  // Sora 2 Pro: 720p + 1080p resolutions
  const baseResolutions: ResolutionOption[] = [
    {
      value: '1280x720',
      label: '720p Landscape',
      aspectRatio: '16:9',
      description: 'Standard HD, YouTube, social media',
    },
    {
      value: '720x1280',
      label: '720p Portrait',
      aspectRatio: '9:16',
      description: 'TikTok, Reels, Stories',
    },
  ];

  const proResolutions: ResolutionOption[] = [
    {
      value: '1792x1024',
      label: '1080p Landscape',
      aspectRatio: '16:9',
      description: 'Higher quality landscape',
    },
    {
      value: '1024x1792',
      label: '1080p Portrait',
      aspectRatio: '9:16',
      description: 'Higher quality vertical',
    },
  ];

  // Sora 2 Pro gets all resolutions, Sora 2 only gets 720p
  const resolutions = isPro ? [...baseResolutions, ...proResolutions] : baseResolutions;

  const currentResolution = resolutions.find(r => r.value === soraResolution);

  // Available modes for Sora
  const soraModes = [
    { value: 'text-to-video', label: 'Text to Video', icon: Monitor },
    { value: 'image-to-video', label: 'Image to Video', icon: ImageIcon },
    { value: 'remix', label: 'Video Remix', icon: Shuffle },
  ] as const;

  return (
    <div className="space-y-5 pt-4 border-t border-white/10">
      {/* Sora badge */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
          OpenAI Sora {isPro ? '2 Pro' : '2'} Settings
        </span>
      </div>

      {/* Generation Mode Selection */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400">Generation Mode</Label>
        <div className="grid grid-cols-3 gap-2">
          {soraModes.map(({ value, label, icon: ModeIcon }) => (
            <Button
              key={value}
              variant={videoGenerationMode === value ? 'default' : 'outline'}
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-2 ${
                videoGenerationMode === value
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'border-white/20 text-gray-400 hover:border-green-500/50 hover:text-white'
              }`}
              onClick={() => setVideoGenerationMode(value)}
            >
              <ModeIcon className="w-4 h-4" />
              <span className="text-[10px]">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Resolution Selection */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" />
          Resolution
        </Label>
        <Select
          value={soraResolution}
          onValueChange={(value) => setSoraResolution(value as SoraResolution)}
        >
          <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white">
            <SelectValue>
              <span className="flex items-center gap-2">
                {currentResolution?.label}
                <span className="text-xs text-gray-400">({currentResolution?.aspectRatio})</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {resolutions.map((res) => (
              <SelectItem
                key={res.value}
                value={res.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm flex items-center gap-2">
                    {res.label}
                    <span className="text-xs text-green-400">({res.aspectRatio})</span>
                  </span>
                  <span className="text-xs text-gray-400">{res.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Selection */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Duration
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {durationOptions.map(({ value, label }) => (
            <Button
              key={value}
              variant={soraDuration === value ? 'default' : 'outline'}
              size="sm"
              className={`h-10 ${
                soraDuration === value
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'border-white/20 text-gray-400 hover:border-green-500/50 hover:text-white'
              }`}
              onClick={() => setSoraDuration(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500">
          Shorter clips tend to be more consistent
        </p>
      </div>

      {/* Note: Image-to-video mode uses the shared KeyframeImageUpload component */}
      {/* It's rendered in MediaStudio.tsx alongside this component */}

      {/* Remix Video Preview (for remix mode) */}
      {videoGenerationMode === 'remix' && soraRemixVideoId && (
        <div className="space-y-3">
          <Label className="text-sm text-gray-400 flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5" />
            Video to Remix
          </Label>
          <div className="relative rounded-lg overflow-hidden border border-green-500/30">
            {soraRemixVideoPreview ? (
              <video
                src={soraRemixVideoPreview}
                className="w-full h-32 object-cover"
                muted
              />
            ) : (
              <div className="w-full h-32 bg-green-500/10 flex items-center justify-center">
                <span className="text-xs text-gray-400">Video ID: {soraRemixVideoId}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-red-500/50"
              onClick={clearSoraRemixVideo}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Describe the changes you want to make in your prompt
          </p>
        </div>
      )}

      {/* Remix mode without video selected */}
      {videoGenerationMode === 'remix' && !soraRemixVideoId && (
        <div className="space-y-3">
          <Label className="text-sm text-gray-400 flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5" />
            Select a Video to Remix
          </Label>
          <div className="border-2 border-dashed border-green-500/30 rounded-lg p-6 text-center">
            <Shuffle className="w-8 h-8 mx-auto mb-2 text-green-400/50" />
            <p className="text-sm text-gray-400">
              Select a previously generated Sora video from your library to remix
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Remix makes targeted adjustments while preserving structure
            </p>
          </div>
        </div>
      )}

      {/* Pro features note */}
      {isPro && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-xs text-green-400">
            <span className="font-semibold">Sora 2 Pro</span> includes synced audio generation.
            Audio will be automatically generated to match your video content.
          </p>
        </div>
      )}
    </div>
  );
};

export default SoraFormatControls;
