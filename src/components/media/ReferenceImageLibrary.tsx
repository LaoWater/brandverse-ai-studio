import { useState } from 'react';
import { Library, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMediaStudio } from '@/contexts/MediaStudioContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ProgressiveImage } from '@/components/ui/ProgressiveImage';

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

const ReferenceImageLibrary = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { addReferenceImage, referenceImages, selectedImageModel } = useMediaStudio();

  const isPro = selectedImageModel === 'gemini-3-pro-image-preview';
  const maxImages = isPro ? 14 : 1;
  const canAddMore = referenceImages.length < maxImages;

  // Fetch user's reference images from storage
  const { data: libraryImages, isLoading } = useQuery({
    queryKey: ['reference-library', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // List files from the user's folder in media-studio-images bucket
      const { data, error } = await supabase.storage
        .from('media-studio-images')
        .list(user.id, {
          limit: 50,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('Error fetching reference library:', error);
        return [];
      }

      // Get public URLs for each image
      const imagesWithUrls = data
        .filter(file => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
        })
        .map((file: StorageFile) => {
          const { data: urlData } = supabase.storage
            .from('media-studio-images')
            .getPublicUrl(`${user.id}/${file.name}`);

          return {
            ...file,
            publicUrl: urlData.publicUrl,
          };
        });

      return imagesWithUrls;
    },
    enabled: !!user?.id && isOpen,
  });

  const handleSelectImage = async (imageUrl: string) => {
    if (!canAddMore) return;

    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Extract filename from URL
      const filename = imageUrl.split('/').pop() || 'reference.jpg';

      // Create a File object from the blob
      const file = new File([blob], filename, { type: blob.type });

      // Add to reference images
      addReferenceImage(file);
    } catch (error) {
      console.error('Error loading image from library:', error);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="!bg-transparent">
      <div className="space-y-3 !bg-transparent">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between !bg-white dark:!bg-gray-800/50 border-primary/30 hover:border-primary/50 hover:!bg-gray-50 dark:hover:!bg-gray-700/50 !text-gray-900 dark:!text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Library className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium !text-gray-900 dark:!text-white">Reference Library</span>
              {libraryImages && libraryImages.length > 0 && (
                <span className="text-xs !text-gray-600 dark:!text-gray-400">
                  ({libraryImages.length} images)
                </span>
              )}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 !text-gray-900 dark:!text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 !text-gray-900 dark:!text-white" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2">
          <div className="rounded-lg border border-primary/20 !bg-white dark:!bg-gray-900/50 p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : libraryImages && libraryImages.length > 0 ? (
              <>
                <p className="text-xs !text-gray-600 dark:!text-gray-400 mb-3">
                  Click to add from your previously used images
                  {!canAddMore && ' (limit reached)'}
                </p>
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {libraryImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleSelectImage(image.publicUrl)}
                      disabled={!canAddMore}
                      className={cn(
                        'relative aspect-square rounded-lg overflow-hidden border transition-all duration-200 group',
                        canAddMore
                          ? 'border-primary/30 hover:border-accent hover:shadow-lg hover:shadow-accent/20 hover:scale-[1.05] cursor-pointer !bg-white dark:!bg-gray-800'
                          : 'border-border/50 opacity-50 cursor-not-allowed !bg-gray-100 dark:!bg-muted/50'
                      )}
                    >
                      <ProgressiveImage
                        src={image.publicUrl}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        thumbnailQuality={15}
                      />

                      {/* Overlay on hover */}
                      {canAddMore && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <div className="p-1.5 rounded-full bg-accent/20 backdrop-blur-sm">
                            <Plus className="w-4 h-4 text-accent" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <Library className="w-8 h-8 !text-gray-400 dark:!text-gray-600 mx-auto mb-2" />
                <p className="text-sm !text-gray-600 dark:!text-gray-400">No images in library yet</p>
                <p className="text-xs !text-gray-500 dark:!text-gray-500 mt-1">
                  Generated images will appear here
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default ReferenceImageLibrary;
