import { Settings2, Maximize2, Sparkles, Info, Coins } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaStudio, AspectRatio, ImageModel } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

const FormatControls = () => {
  const {
    aspectRatio,
    setAspectRatio,
    selectedImageModel,
    imageSize,
    setImageSize,
  } = useMediaStudio();

  const aspectRatios: { value: AspectRatio; label: string; description: string }[] = [
    { value: '1:1', label: '1:1 Square', description: 'Perfect for social media' },
    { value: '16:9', label: '16:9 Landscape', description: 'YouTube, widescreen' },
    { value: '9:16', label: '9:16 Portrait', description: 'TikTok, Instagram Stories' },
    { value: '4:3', label: '4:3 Standard', description: 'Classic format' },
    { value: '3:4', label: '3:4 Portrait', description: 'Instagram Feed' },
    { value: '3:2', label: '3:2 Classic', description: 'Photography standard' },
  ];

  // Quality options based on selected model
  const getQualityOptions = (model: ImageModel) => {
    if (model === 'imagen-4.0-generate-001') {
      // Imagen 4 supports 1K and 2K
      return [
        { value: '1K', label: 'Standard (1K)', description: 'Standard resolution - 3 credits' },
        { value: '2K', label: 'High (2K)', description: 'Higher resolution - 4 credits' },
      ];
    }
    if (model === 'gemini-3-pro-image-preview') {
      // Gemini 3 Pro supports 1K, 2K, and 4K
      return [
        { value: '1K', label: 'Standard (1K)', description: 'Fast & efficient - 3 credits' },
        { value: '2K', label: 'High (2K)', description: 'Enhanced quality - 5 credits' },
        { value: '4K', label: 'Ultra (4K)', description: 'Professional grade - 8 credits' },
      ];
    }
    if (model === 'gpt-image-1.5') {
      // GPT-Image-1.5 supports different sizes and quality
      return [
        { value: '1K', label: 'Standard', description: 'Standard Quality - 3 credits' },
        { value: '2K', label: 'HD', description: 'Ultra Quality - 5 credits' },
      ];
    }
    // Gemini 2.5 Flash doesn't have quality settings (always 1K)
    return [];
  };

  const qualityOptions = getQualityOptions(selectedImageModel);
  const showQualitySelector = qualityOptions.length > 0;

  // Calculate credits based on model and quality
  const getEstimatedCredits = () => {
    if (selectedImageModel === 'gemini-2.5-flash-image') return 2;
    if (selectedImageModel === 'gemini-3-pro-image-preview') {
      return imageSize === '4K' ? 8 : imageSize === '2K' ? 5 : 3;
    }
    if (selectedImageModel === 'imagen-4.0-generate-001') {
      return imageSize === '2K' ? 4 : 3;
    }
    if (selectedImageModel === 'gpt-image-1.5') {
      return imageSize === '2K' ? 5 : 3;
    }
    return 3;
  };

  const estimatedCredits = getEstimatedCredits();

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
                <div className="flex flex-col py-1">
                  <span className="font-medium text-sm">{ratio.label}</span>
                  <span className="text-xs text-gray-400">{ratio.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quality - Only for models that support it */}
      {showQualitySelector && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quality
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-4 h-4 p-0 text-gray-500 hover:text-white">
                    <Info className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-white/20 text-white max-w-xs">
                  <p className="text-xs">
                    {selectedImageModel === 'gpt-image-1.5'
                      ? 'HD quality uses higher resolution (1536px) adaptive to aspect ratio'
                      : 'Higher quality produces more detailed images at larger resolution'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={imageSize} onValueChange={(value) => setImageSize(value as '1K' | '2K' | '4K')}>
            <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white hover:border-primary/40 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/20">
              {qualityOptions.map((quality) => (
                <SelectItem
                  key={quality.value}
                  value={quality.value}
                  className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                >
                  <div className="flex flex-col py-1">
                    <span className="font-medium text-sm">{quality.label}</span>
                    <span className="text-xs text-gray-400">{quality.description}</span>
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
            <Coins className="w-3.5 h-3.5" />
            {estimatedCredits} credits
          </span>
        </div>
      </div>
    </div>
  );
};

export default FormatControls;
