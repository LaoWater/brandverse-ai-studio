import { Image, Video } from 'lucide-react';
import { useMediaStudio, MediaType } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';

const MediaTypeSwitcher = () => {
  const { mediaType, setMediaType } = useMediaStudio();

  const mediaTypes: { value: MediaType; label: string; icon: typeof Image }[] = [
    { value: 'image', label: 'Image', icon: Image },
    { value: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-400">Media Type</Label>
      <div className="grid grid-cols-2 gap-2">
        {mediaTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = mediaType === type.value;

          return (
            <button
              key={type.value}
              onClick={() => setMediaType(type.value)}
              className={`
                flex items-center justify-center gap-2 py-3 px-4 rounded-lg
                border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-primary/20 bg-background/50 text-gray-400 hover:border-primary/40 hover:text-white'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : ''}`} />
              <span className="font-medium text-sm">{type.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MediaTypeSwitcher;
