import { useState } from 'react';
import { Upload, X, FrameIcon, Image as ImageIcon } from 'lucide-react';
import { useMediaStudio } from '@/contexts/MediaStudioContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const KeyframeImageUpload = () => {
  const {
    videoGenerationMode,
    firstFrameImage,
    firstFramePreview,
    lastFrameImage,
    lastFramePreview,
    inputVideoImage,
    inputVideoImagePreview,
    setFirstFrameImage,
    setLastFrameImage,
    setInputVideoImage,
  } = useMediaStudio();

  const { toast } = useToast();

  const handleFileSelect = (
    file: File | null,
    frameType: 'first' | 'last' | 'input'
  ) => {
    if (!file) return;

    // Validate file type - only allow PNG and JPEG (Veo API requirement)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast({
        title: 'Unsupported Image Format',
        description: 'Please upload PNG or JPEG images only. AVIF, WebP, and other formats are not supported by the video generation API.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Set the appropriate frame
    if (frameType === 'first') {
      setFirstFrameImage(file);
    } else if (frameType === 'last') {
      setLastFrameImage(file);
    } else {
      setInputVideoImage(file);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    frameType: 'first' | 'last' | 'input'
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file, frameType);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Render upload zone
  const renderUploadZone = (
    frameType: 'first' | 'last' | 'input',
    label: string,
    preview: string | null,
    image: File | null,
    setter: (file: File | null) => void
  ) => (
    <div className="space-y-2">
      <Label className="text-sm text-gray-400">{label}</Label>
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt={label}
            className="w-full h-40 object-cover rounded-lg border-2 border-primary/20"
          />
          <button
            onClick={() => setter(null)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-xs text-white">
            {image?.name}
          </div>
        </div>
      ) : (
        <div
          onDrop={(e) => handleDrop(e, frameType)}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-background/30"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png, image/jpeg, image/jpg';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileSelect(file, frameType);
            };
            input.click();
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/30">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Upload {label}</p>
              <p className="text-xs text-gray-400">Click or drag & drop</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Show for interpolation mode (Veo 3.1 official: creates smooth transition between two images)
  if (videoGenerationMode === 'interpolation') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <FrameIcon className="w-4 h-4 text-accent" />
          Interpolation Images
        </div>
        <p className="text-xs text-gray-400">
          Upload start and end images. Veo 3.1 will generate a smooth morphing transition between them.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {renderUploadZone(
            'first',
            'Start Image',
            firstFramePreview,
            firstFrameImage,
            setFirstFrameImage
          )}
          {renderUploadZone(
            'last',
            'End Image',
            lastFramePreview,
            lastFrameImage,
            setLastFrameImage
          )}
        </div>
      </div>
    );
  }

  // Show for image-to-video mode
  if (videoGenerationMode === 'image-to-video') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <ImageIcon className="w-4 h-4 text-accent" />
          Input Image
        </div>
        <p className="text-xs text-gray-400">
          Upload an image to animate. Describe the motion you want in the prompt.
        </p>
        {renderUploadZone(
          'input',
          'Input Image',
          inputVideoImagePreview,
          inputVideoImage,
          setInputVideoImage
        )}
      </div>
    );
  }

  // Don't show anything for text-to-video mode
  return null;
};

export default KeyframeImageUpload;
