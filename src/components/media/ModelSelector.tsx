import { Brain, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, ImageModel } from '@/contexts/MediaStudioContext';

const ModelSelector = () => {
  const { selectedImageModel, setSelectedImageModel } = useMediaStudio();

  const imageModels: { value: ImageModel; label: string; description: string; badge?: string }[] = [
    {
      value: 'nano-banana',
      label: 'Nano Banana',
      description: 'Google Gemini 2.5 Flash - Fast & creative',
      badge: 'FAST',
    },
    {
      value: 'chatgpt-image',
      label: 'ChatGPT Image',
      description: 'OpenAI gpt-image-1 - High quality & precise',
      badge: 'PRECISE',
    },
    {
      value: 'google-imagen-4',
      label: 'Google Imagen 4',
      description: 'Google Imagen 4 - Advanced image generation',
      badge: 'ADVANCED',
    },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        AI Model
      </label>

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
              className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3 min-h-[60px]"
            >
              <div className="flex flex-col gap-1.5 py-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{model.label}</span>
                  {model.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-semibold">
                      {model.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 leading-relaxed">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
