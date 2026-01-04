import { Cpu, Zap, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, VideoModel } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

const VideoModelSelector = () => {
  const { selectedVideoModel, setSelectedVideoModel } = useMediaStudio();

  const videoModels: {
    value: VideoModel;
    label: string;
    description: string;
    icon: typeof Star;
  }[] = [
    {
      value: 'veo-3.1-fast-generate-001',
      label: 'Veo 3.1 Fast',
      description: 'Rapid iterations & A/B testing',
      icon: Zap,
    },
    {
      value: 'veo-3.1-generate-001',
      label: 'Veo 3.1 Standard',
      description: 'High-quality production videos',
      icon: Star,
    },
  ];

  const currentModel = videoModels.find(m => m.value === selectedVideoModel);
  const Icon = currentModel?.icon || Cpu;

  return (
    <div className="space-y-3">
      <Label className="text-sm text-gray-400 flex items-center gap-1.5">
        <Cpu className="w-3.5 h-3.5" />
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
              {currentModel?.label}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/20">
          {videoModels.map((model) => {
            const ModelIcon = model.icon;
            return (
              <SelectItem
                key={model.value}
                value={model.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
              >
                <div className="flex items-center gap-3">
                  <ModelIcon className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{model.label}</span>
                    <span className="text-xs text-gray-400">{model.description}</span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VideoModelSelector;
