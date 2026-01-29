import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { MessageSquare, GripVertical } from 'lucide-react';
import type { CaptionSegment } from '@/types/editor';

interface CaptionTimelineTrackProps {
  captions: CaptionSegment[];
  scale: number; // pixels per second
  timelineWidth: number;
  selectedCaptionId: string | null;
  onSelectCaption: (id: string | null) => void;
  onUpdateCaption: (id: string, updates: Partial<CaptionSegment>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const CaptionTimelineTrack = ({
  captions,
  scale,
  timelineWidth,
  selectedCaptionId,
  onSelectCaption,
  onUpdateCaption,
  onDragStart,
  onDragEnd,
}: CaptionTimelineTrackProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    captionId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStartTime: number;
    originalEndTime: number;
  } | null>(null);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => time * scale, [scale]);

  // Convert pixel to time
  const pixelToTime = useCallback(
    (pixel: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const scrollLeft = trackRef.current.parentElement?.scrollLeft || 0;
      return Math.max(0, (pixel - rect.left + scrollLeft) / scale);
    },
    [scale]
  );

  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  }, []);

  // Handle drag start for moving
  const handleDragStart = useCallback(
    (e: React.MouseEvent, captionId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const caption = captions.find((c) => c.id === captionId);
      if (!caption) return;

      onDragStart?.();
      onSelectCaption(captionId);

      setDragState({
        captionId,
        type: 'move',
        startX: e.clientX,
        originalStartTime: caption.startTime,
        originalEndTime: caption.endTime,
      });
    },
    [captions, onDragStart, onSelectCaption]
  );

  // Handle drag start for resizing
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, captionId: string, edge: 'start' | 'end') => {
      e.preventDefault();
      e.stopPropagation();

      const caption = captions.find((c) => c.id === captionId);
      if (!caption) return;

      onDragStart?.();
      onSelectCaption(captionId);

      setDragState({
        captionId,
        type: edge === 'start' ? 'resize-start' : 'resize-end',
        startX: e.clientX,
        originalStartTime: caption.startTime,
        originalEndTime: caption.endTime,
      });
    },
    [captions, onDragStart, onSelectCaption]
  );

  // Handle mouse move and up
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / scale;

      if (dragState.type === 'move') {
        const duration = dragState.originalEndTime - dragState.originalStartTime;
        const newStartTime = Math.max(0, dragState.originalStartTime + deltaTime);
        const newEndTime = newStartTime + duration;

        onUpdateCaption(dragState.captionId, {
          startTime: newStartTime,
          endTime: newEndTime,
        });
      } else if (dragState.type === 'resize-start') {
        const newStartTime = Math.max(0, dragState.originalStartTime + deltaTime);
        const maxStart = dragState.originalEndTime - 0.5; // Minimum 0.5s duration
        const clampedStart = Math.min(newStartTime, maxStart);

        onUpdateCaption(dragState.captionId, { startTime: clampedStart });
      } else if (dragState.type === 'resize-end') {
        const newEndTime = Math.max(dragState.originalStartTime + 0.5, dragState.originalEndTime + deltaTime);

        onUpdateCaption(dragState.captionId, { endTime: newEndTime });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      onDragEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, scale, onUpdateCaption, onDragEnd]);

  // Sort captions by start time
  const sortedCaptions = useMemo(() =>
    [...captions].sort((a, b) => a.startTime - b.startTime),
    [captions]
  );

  return (
    <div
      ref={trackRef}
      className="relative h-10 bg-yellow-500/5 dark:bg-yellow-900/10"
      style={{ width: timelineWidth }}
    >
      {/* Caption segments - NO label inside, label is handled by parent */}
      {sortedCaptions.map((caption) => {
        const left = timeToPixel(caption.startTime); // No offset - label is outside
        const width = timeToPixel(caption.endTime - caption.startTime);
        const isSelected = selectedCaptionId === caption.id;
        const isBeingDragged = dragState?.captionId === caption.id;

        return (
          <div
            key={caption.id}
            className={`absolute top-1 h-8 rounded border-2 transition-all overflow-hidden cursor-grab active:cursor-grabbing ${
              isSelected
                ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-400/50 dark:bg-yellow-500/40 z-20'
                : 'border-yellow-500/60 dark:border-yellow-500/50 bg-yellow-300/40 dark:bg-yellow-500/20 hover:border-yellow-500 dark:hover:border-yellow-400'
            } ${isBeingDragged ? 'shadow-lg shadow-yellow-500/30' : ''}`}
            style={{
              left: left,
              width: Math.max(width, 40),
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectCaption(caption.id);
            }}
          >
            {/* Drag handle - main content area */}
            <div
              className="absolute inset-0 flex items-center px-3"
              onMouseDown={(e) => handleDragStart(e, caption.id)}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <GripVertical className="w-3 h-3 text-yellow-700 dark:text-yellow-300 opacity-60 flex-shrink-0" />
                <span className="text-[11px] text-yellow-900 dark:text-yellow-100 truncate font-medium">
                  {caption.text.trim() ? caption.text.substring(0, 25) : 'Empty'}
                  {caption.text.length > 25 ? '...' : ''}
                </span>
              </div>
              <span className="text-[9px] text-yellow-700/80 dark:text-yellow-300/70 flex-shrink-0 ml-1">
                {formatTime(caption.endTime - caption.startTime)}
              </span>
            </div>

            {/* Resize handles */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:w-2 transition-all group"
              onMouseDown={(e) => handleResizeStart(e, caption.id, 'start')}
            >
              <div className="absolute inset-y-1 left-0.5 w-1 bg-yellow-600/60 dark:bg-yellow-300/60 rounded-full group-hover:bg-yellow-500 dark:group-hover:bg-yellow-200" />
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:w-2 transition-all group"
              onMouseDown={(e) => handleResizeStart(e, caption.id, 'end')}
            >
              <div className="absolute inset-y-1 right-0.5 w-1 bg-yellow-600/60 dark:bg-yellow-300/60 rounded-full group-hover:bg-yellow-500 dark:group-hover:bg-yellow-200" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Track label component for use outside the scrollable area
export const CaptionTrackLabel = () => (
  <div className="h-10 w-16 flex items-center justify-center bg-slate-100 dark:bg-black/20 border-r border-slate-200 dark:border-white/10">
    <MessageSquare className="w-3 h-3 text-yellow-500 dark:text-yellow-400 mr-1" />
    <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-medium">Subs</span>
  </div>
);

export default CaptionTimelineTrack;
