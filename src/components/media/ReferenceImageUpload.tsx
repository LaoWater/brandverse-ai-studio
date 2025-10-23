import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useMediaStudio } from '@/contexts/MediaStudioContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ReferenceImageUpload = () => {
  const { referenceImage, referenceImagePreview, setReferenceImage } = useMediaStudio();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setReferenceImage(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setReferenceImage(files[0]);
    }
  };

  const handleRemove = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-primary" />
        Reference Image
        <span className="text-xs text-gray-500 font-normal">(Optional)</span>
      </label>

      {!referenceImagePreview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-300',
            isDragging
              ? 'border-accent bg-accent/10 scale-[1.02]'
              : 'border-primary/30 hover:border-primary/50 bg-background/30 hover:bg-background/50'
          )}
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
                'w-8 h-8 transition-colors',
                isDragging ? 'text-accent' : 'text-primary'
              )} />
            </div>

            <div>
              <p className="text-white font-medium mb-1">
                {isDragging ? 'Drop your image here' : 'Upload a reference image'}
              </p>
              <p className="text-sm text-gray-400">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, WebP up to 10MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border-2 border-primary/30">
            <img
              src={referenceImagePreview}
              alt="Reference"
              className="w-full h-48 object-cover"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                onClick={handleRemove}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Remove
              </Button>
            </div>
          </div>

          {/* File info */}
          {referenceImage && (
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span className="truncate max-w-[200px]">{referenceImage.name}</span>
              <span>{(referenceImage.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        The AI will use this image as inspiration for style, composition, or subject matter.
      </p>
    </div>
  );
};

export default ReferenceImageUpload;
