import { useMemo } from 'react';
import type { CaptionSegment, CaptionStyle } from '@/types/editor';

interface CaptionPreviewProps {
  captions: CaptionSegment[];
  currentTime: number;
  globalStyle: CaptionStyle;
}

export const CaptionPreview = ({
  captions,
  currentTime,
  globalStyle,
}: CaptionPreviewProps) => {
  // Find captions visible at current time
  const visibleCaptions = useMemo(() => {
    return captions.filter(
      (caption) => currentTime >= caption.startTime && currentTime < caption.endTime
    );
  }, [captions, currentTime]);

  if (visibleCaptions.length === 0) return null;

  // Position styles based on globalStyle.position
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    textAlign: 'center',
    pointerEvents: 'none',
    zIndex: 30,
    ...(globalStyle.position === 'top' && { top: '5%' }),
    ...(globalStyle.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
    ...(globalStyle.position === 'bottom' && { bottom: '10%' }),
  };

  return (
    <div style={positionStyles}>
      {visibleCaptions.map((caption) => {
        const style = caption.style || globalStyle;

        return (
          <div
            key={caption.id}
            className="inline-block px-3 py-1.5 rounded transition-opacity"
            style={{
              fontSize: `${style.fontSize}px`,
              color: style.fontColor,
              backgroundColor: style.backgroundColor,
              fontWeight: 500,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              lineHeight: 1.4,
              maxWidth: '100%',
              wordWrap: 'break-word',
            }}
          >
            {caption.text}
          </div>
        );
      })}
    </div>
  );
};

export default CaptionPreview;
