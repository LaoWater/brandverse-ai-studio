import { useRef, useState, useEffect, useCallback } from 'react';
import type { TextOverlay } from '@/types/editor';
import { isTextOverlayVisible } from '@/types/editor';
import { TextPositionHandle } from './TextPositionHandle';

interface TextOverlayPreviewProps {
  overlays: TextOverlay[];
  currentTime: number;
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  videoRef?: React.RefObject<HTMLVideoElement>; // Reference to video element for proper positioning
}

export const TextOverlayPreview = ({
  overlays,
  currentTime,
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlay,
  videoRef,
}: TextOverlayPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoBoundsRef = useRef<HTMLDivElement>(null); // Ref to the video bounds wrapper
  const [videoBounds, setVideoBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Calculate the actual rendered video bounds within the container
  const updateVideoBounds = useCallback(() => {
    if (!containerRef.current || !videoRef?.current) {
      setVideoBounds(null);
      return;
    }

    const container = containerRef.current;
    const video = videoRef.current;

    // Get natural video dimensions
    const videoNaturalWidth = video.videoWidth || 1080;
    const videoNaturalHeight = video.videoHeight || 1920;
    const videoAspectRatio = videoNaturalWidth / videoNaturalHeight;

    // Get container dimensions
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    // Calculate rendered video size (object-contain behavior)
    let renderedWidth: number;
    let renderedHeight: number;

    if (videoAspectRatio > containerAspectRatio) {
      // Video is wider - width constrained
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / videoAspectRatio;
    } else {
      // Video is taller - height constrained
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * videoAspectRatio;
    }

    // Calculate offset to center the video
    const offsetX = (containerWidth - renderedWidth) / 2;
    const offsetY = (containerHeight - renderedHeight) / 2;

    setVideoBounds({
      left: offsetX,
      top: offsetY,
      width: renderedWidth,
      height: renderedHeight,
    });
  }, [videoRef]);

  // Update bounds when video loads or container resizes
  useEffect(() => {
    updateVideoBounds();

    const video = videoRef?.current;
    if (video) {
      video.addEventListener('loadedmetadata', updateVideoBounds);
      return () => video.removeEventListener('loadedmetadata', updateVideoBounds);
    }
  }, [updateVideoBounds, videoRef]);

  // Also update on window resize
  useEffect(() => {
    window.addEventListener('resize', updateVideoBounds);
    return () => window.removeEventListener('resize', updateVideoBounds);
  }, [updateVideoBounds]);

  // Filter overlays visible at current time
  const visibleOverlays = overlays.filter((overlay) =>
    isTextOverlayVisible(overlay, currentTime)
  );

  const handleContainerClick = () => {
    // Deselect when clicking on empty space
    onSelectOverlay(null);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      onClick={handleContainerClick}
    >
      {/* Video bounds wrapper - single element that all overlays position relative to */}
      {videoBounds && (
        <div
          ref={videoBoundsRef}
          className="absolute overflow-hidden"
          style={{
            left: videoBounds.left,
            top: videoBounds.top,
            width: videoBounds.width,
            height: videoBounds.height,
          }}
        >
          {visibleOverlays.map((overlay) => (
            <TextPositionHandle
              key={overlay.id}
              overlay={overlay}
              containerRef={videoBoundsRef}
              isSelected={selectedOverlayId === overlay.id}
              onSelect={() => onSelectOverlay(overlay.id)}
              onPositionChange={(position) =>
                onUpdateOverlay(overlay.id, { position })
              }
              onFontSizeChange={(fontSize) =>
                onUpdateOverlay(overlay.id, {
                  style: { ...overlay.style, fontSize },
                })
              }
            />
          ))}
        </div>
      )}
      {/* Fallback when video bounds not available */}
      {!videoBounds && visibleOverlays.map((overlay) => (
        <TextPositionHandle
          key={overlay.id}
          overlay={overlay}
          containerRef={containerRef}
          isSelected={selectedOverlayId === overlay.id}
          onSelect={() => onSelectOverlay(overlay.id)}
          onPositionChange={(position) =>
            onUpdateOverlay(overlay.id, { position })
          }
          onFontSizeChange={(fontSize) =>
            onUpdateOverlay(overlay.id, {
              style: { ...overlay.style, fontSize },
            })
          }
        />
      ))}
    </div>
  );
};

export default TextOverlayPreview;
