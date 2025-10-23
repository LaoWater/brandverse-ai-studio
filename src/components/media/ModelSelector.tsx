import { Brain, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, VideoModel, ImageModel } from '@/contexts/MediaStudioContext';

const ModelSelector = () => {
  const {
    mediaType,
    selectedVideoModel,
    selectedImageModel,
    setSelectedVideoModel,
    setSelectedImageModel,
  } = useMediaStudio();

  const videoModels: { value: VideoModel; label: string; description: string }[] = [
    { value: 'veo-3.1', label: 'Google Veo 3.1', description: 'Latest video generation model' },
    { value: 'sora-2', label: 'OpenAI Sora 2', description: 'Advanced video synthesis' },
  ];

  const imageModels: { value: ImageModel; label: string; description: string }[] = [
    { value: 'imagen-4', label: 'Google Imagen 4', description: 'State-of-the-art image generation' },
  ];

  const isVideo = mediaType === 'video';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        AI Model
      </label>

      {isVideo ? (
        <Select value={selectedVideoModel} onValueChange={setSelectedVideoModel}>
          <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {videoModels.map((model) => (
              <SelectItem
                key={model.value}
                value={model.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{model.label}</span>
                  <span className="text-xs text-gray-400">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select value={selectedImageModel} onValueChange={setSelectedImageModel}>
          <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {imageModels.map((model) => (
              <SelectItem
                key={model.value}
                value={model.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{model.label}</span>
                  <span className="text-xs text-gray-400">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ModelSelector;
