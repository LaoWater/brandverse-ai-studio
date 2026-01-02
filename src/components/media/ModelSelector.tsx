import { Brain, Cpu, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, ImageModel, NanoBananaVariant } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

const ModelSelector = () => {
  const {
    selectedImageModel,
    setSelectedImageModel,
    nanoBananaVariant,
    setNanoBananaVariant
  } = useMediaStudio();

  const imageModels: {
    value: ImageModel;
    label: string;
    description: string;
  }[] = [
    {
      value: 'gemini-2.5-flash-image',
      label: 'Google Nano Banana',
      description: 'Flagship Visual Models',
    },
    {
      value: 'imagen-4.0-generate-001',
      label: 'Google Imagen 4',
      description: 'Leading text-to-image model',
    },
    {
      value: 'gpt-image-1.5',
      label: 'OpenAI GPT Image 1.5',
      description: 'Instruction Following & Realism',
    },
  ];

  const isNanoBanana = selectedImageModel === 'gemini-2.5-flash-image' ||
                       selectedImageModel === 'gemini-3-pro-image-preview';

  const nanoBananaVariants: {
    value: NanoBananaVariant;
    label: string;
    description: string;
  }[] = [
    {
      value: 'standard',
      label: 'Standard',
      description: 'Fast & Creative',
    },
    {
      value: 'pro',
      label: 'Pro',
      description: 'Realistic 4K & Multi-reference',
    },
  ];

  // Get the display value based on whether Nano Banana is selected
  const getDisplayValue = () => {
    if (isNanoBanana) {
      return 'Google Nano Banana';
    }
    const model = imageModels.find(m => m.value === selectedImageModel);
    return model?.label || 'Select Model';
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm text-gray-400 flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5" />
        AI Model
      </Label>

      <Select
        value={isNanoBanana ? 'gemini-2.5-flash-image' : selectedImageModel}
        onValueChange={(value) => {
          setSelectedImageModel(value as ImageModel);
          // Reset to standard variant when switching to Nano Banana
          if (value === 'gemini-2.5-flash-image') {
            setNanoBananaVariant('standard');
          }
        }}
      >
        <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            <SelectValue placeholder="Select Model">
              {getDisplayValue()}
            </SelectValue>
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

      {/* Nano Banana Variant Selector - Only shown when Nano Banana is selected */}
      {isNanoBanana && (
        <Select
          value={nanoBananaVariant}
          onValueChange={(value) => setNanoBananaVariant(value as NanoBananaVariant)}
        >
          <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {nanoBananaVariants.map((variant) => (
              <SelectItem
                key={variant.value}
                value={variant.value}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">{variant.label}</span>
                  <span className="text-xs text-gray-400">{variant.description}</span>
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
