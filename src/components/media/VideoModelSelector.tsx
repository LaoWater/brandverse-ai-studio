import { Cpu, Zap, Star, Sparkles, Video } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, VideoModel } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

interface VideoModelOption {
  value: VideoModel;
  label: string;
  description: string;
  icon: typeof Star;
  maxDuration: number;
  provider: 'google' | 'openai';
}

const VideoModelSelector = () => {
  const { selectedVideoModel, setSelectedVideoModel } = useMediaStudio();

  const veoModels: VideoModelOption[] = [
    {
      value: 'veo-3.1-fast-generate-001',
      label: 'Veo 3.1 Fast',
      description: 'Rapid iterations & A/B testing',
      icon: Zap,
      maxDuration: 8,
      provider: 'google',
    },
    {
      value: 'veo-3.1-generate-001',
      label: 'Veo 3.1 Standard',
      description: 'High-quality production videos',
      icon: Star,
      maxDuration: 8,
      provider: 'google',
    },
  ];

  const soraModels: VideoModelOption[] = [
    {
      value: 'sora-2',
      label: 'Sora 2',
      description: 'Fast, flexible - 720p only',
      icon: Zap,
      maxDuration: 12,
      provider: 'openai',
    },
    {
      value: 'sora-2-pro',
      label: 'Sora 2 Pro',
      description: 'Higher quality - 720p & 1080p',
      icon: Sparkles,
      maxDuration: 12,
      provider: 'openai',
    },
  ];

  const allModels = [...veoModels, ...soraModels];
  const currentModel = allModels.find(m => m.value === selectedVideoModel);
  const Icon = currentModel?.icon || Cpu;

  // Get provider badge color
  const getProviderColor = (provider: 'google' | 'openai') =>
    provider === 'openai' ? 'text-green-400' : 'text-blue-400';

  return (
    <div className="space-y-3">
      <Label className="text-sm text-gray-400 flex items-center gap-1.5">
        <Video className="w-3.5 h-3.5" />
        Video Model
      </Label>

      <Select
        value={selectedVideoModel}
        onValueChange={(value) => setSelectedVideoModel(value as VideoModel)}
      >
        <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-accent" />
            <SelectValue placeholder="Select Model">
              <span className="flex items-center gap-2">
                {currentModel?.label}
                {currentModel && (
                  <span className={`text-[10px] font-medium uppercase ${getProviderColor(currentModel.provider)}`}>
                    {currentModel.provider === 'openai' ? 'OpenAI' : 'Google'}
                  </span>
                )}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/20 max-h-[400px]">
          {/* Google Veo Models */}
          <SelectGroup>
            <SelectLabel className="text-xs text-blue-400 font-semibold uppercase tracking-wider px-2 py-1.5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Google Veo 3.1
            </SelectLabel>
            {veoModels.map((model) => {
              const ModelIcon = model.icon;
              return (
                <SelectItem
                  key={model.value}
                  value={model.value}
                  className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
                >
                  <div className="flex items-center gap-3">
                    <ModelIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{model.label}</span>
                      <span className="text-xs text-gray-400">{model.description}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>

          {/* OpenAI Sora Models */}
          <SelectGroup>
            <SelectLabel className="text-xs text-green-400 font-semibold uppercase tracking-wider px-2 py-1.5 flex items-center gap-1.5 mt-2 border-t border-white/10 pt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              OpenAI Sora 2
            </SelectLabel>
            {soraModels.map((model) => {
              const ModelIcon = model.icon;
              return (
                <SelectItem
                  key={model.value}
                  value={model.value}
                  className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
                >
                  <div className="flex items-center gap-3">
                    <ModelIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{model.label}</span>
                      <span className="text-xs text-gray-400">{model.description}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default VideoModelSelector;
