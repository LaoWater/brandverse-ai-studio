import { Video, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaStudio, MediaType } from '@/contexts/MediaStudioContext';

const MediaTypeSwitcher = () => {
  const { mediaType, setMediaType } = useMediaStudio();

  const types: { value: MediaType; label: string; icon: typeof Video }[] = [
    { value: 'image', label: 'Image', icon: Image },
    { value: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">Media Type</label>
      <div className="grid grid-cols-2 gap-2 p-1 bg-background/50 rounded-lg border border-primary/20">
        {types.map((type) => {
          const Icon = type.icon;
          const isActive = mediaType === type.value;

          return (
            <button
              key={type.value}
              onClick={() => setMediaType(type.value)}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-300',
                'text-sm font-medium',
                isActive
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MediaTypeSwitcher;
