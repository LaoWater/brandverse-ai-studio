import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  thumbnailQuality?: number; // 1-100, default 10
  onLoad?: () => void;
}

/**
 * Progressive image component with blur-up effect
 * Shows a low-quality placeholder that fades into the full image
 */
export function ProgressiveImage({
  src,
  alt,
  className,
  containerClassName,
  thumbnailQuality = 10,
  onLoad,
}: ProgressiveImageProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setIsLoading(false);
      // Fallback to original src
      setImgSrc(src);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isInView, onLoad]);

  // Generate thumbnail URL for Supabase Storage
  // Note: This uses Supabase's image transformation API
  // Format: {publicUrl}?width=50&quality=10
  const getThumbnailUrl = (url: string, quality: number) => {
    if (!url.includes('supabase')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=50&quality=${quality}`;
  };

  const thumbnailUrl = getThumbnailUrl(src, thumbnailQuality);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', containerClassName)}>
      {/* Skeleton background */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
      )}

      {/* Low-quality placeholder (blurred) */}
      {isInView && (
        <img
          src={thumbnailUrl}
          alt={alt}
          className={cn(
            'absolute inset-0 w-full h-full object-cover blur-md scale-105 transition-opacity duration-500',
            isLoading ? 'opacity-100' : 'opacity-0',
            className
          )}
          aria-hidden="true"
        />
      )}

      {/* Full quality image */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          className={cn(
            'relative w-full h-full object-cover transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
        />
      )}
    </div>
  );
}
