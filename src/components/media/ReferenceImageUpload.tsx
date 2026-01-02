import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Plus, Images } from 'lucide-react';
import { useMediaStudio } from '@/contexts/MediaStudioContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ReferenceImageUpload = () => {
  const {
    referenceImages,
    referenceImagePreviews,
    addReferenceImage,
    removeReferenceImage,
    clearReferenceImages,
    selectedImageModel
  } = useMediaStudio();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get max images based on model
  const isPro = selectedImageModel === 'gemini-3-pro-image-preview';
  const maxImages = isPro ? 14 : 1;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (referenceImages.length < maxImages) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (referenceImages.length >= maxImages) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    imageFiles.slice(0, maxImages - referenceImages.length).forEach(file => {
      addReferenceImage(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    imageFiles.slice(0, maxImages - referenceImages.length).forEach(file => {
      addReferenceImage(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    removeReferenceImage(index);
  };

  const canAddMore = referenceImages.length < maxImages;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Images className="w-4 h-4 text-primary" />
          Reference Images
          <span className="text-xs text-gray-500 font-normal">(Optional)</span>
        </label>

        {referenceImages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {referenceImages.length}/{maxImages}
            </span>
            <Button
              onClick={clearReferenceImages}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-400 hover:text-white"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-3 transition-all duration-300',
          isDragging && canAddMore
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-primary/30 bg-background/30'
        )}
      >
        {referenceImages.length === 0 ? (
          // Empty state - large drop zone
          <div
            onClick={() => canAddMore && fileInputRef.current?.click()}
            className="cursor-pointer p-6"
          >
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div
                className={cn(
                  'p-4 rounded-full transition-all duration-300',
                  isDragging
                    ? 'bg-accent/20 animate-bounce'
                    : 'bg-primary/10'
                )}
              >
                <Upload className={cn(
                  'w-6 h-6 transition-colors',
                  isDragging ? 'text-accent' : 'text-primary'
                )} />
              </div>

              <div>
                <p className="text-white font-medium mb-1 text-sm">
                  {isDragging ? 'Drop your images here' : 'Upload reference images'}
                </p>
                <p className="text-xs text-gray-400">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WebP • Up to {maxImages} image{maxImages > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Grid of images
          <div className="grid grid-cols-2 gap-2">
            {referenceImagePreviews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <div className="relative rounded-lg overflow-hidden border border-primary/20 h-full">
                  <img
                    src={preview}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Button
                      onClick={() => handleRemove(index)}
                      variant="destructive"
                      size="sm"
                      className="gap-1.5 h-7 px-2"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  </div>

                  {/* Image number badge */}
                  <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-medium">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}

            {/* Add more button */}
            {canAddMore && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-300',
                  'border-primary/30 bg-background/20 hover:border-primary/50 hover:bg-background/40'
                )}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-gray-400">Add More</span>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelect}
          multiple={isPro}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-500">
        {isPro
          ? 'Pro model supports up to 14 reference images for advanced composition and character consistency.'
          : 'The AI will use this image as inspiration for style, composition, or subject matter.'}
      </p>
    </div>
  );
};

export default ReferenceImageUpload;
