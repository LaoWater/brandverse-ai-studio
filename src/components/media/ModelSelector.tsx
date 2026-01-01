import { Brain, Cpu } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, ImageModel } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

const ModelSelector = () => {
  const { selectedImageModel, setSelectedImageModel } = useMediaStudio();

  const imageModels: {
    value: ImageModel;
    label: string;
    description: string;
  }[] = [
    {
      value: 'gemini-2.5-flash-image',
      label: 'Google Nano Banana',
      description: 'Fast & creative generation',
    },
    {
      value: 'imagen-4.0-generate-001',
      label: 'Google Imagen 4',
      description: 'Advanced Generation HQ',
    },
    {
      value: 'gpt-image-1.5',
      label: 'Latest ChatGPT Image',
      description: 'Instruction following & realism',
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-400 flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5" />
        AI Model
      </Label>

      <Select value={selectedImageModel} onValueChange={setSelectedImageModel}>
        <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/20">
          {imageModels.map((model) => (
            <SelectItem
              key={model.value}
              value={model.value}
              className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{model.label}</span>
                <span className="text-xs text-gray-400">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
