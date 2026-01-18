import { useCallback, useRef, useState, useEffect } from 'react';
import { Type, GripVertical } from 'lucide-react';
import type { TextOverlay } from '@/types/editor';

interface TextTimelineTrackProps {
  overlays: TextOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  scale: number; // pixels per second
  timelineWidth: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  snapToGrid?: boolean; // Enable snap-to-grid (default: true)
  gridSize?: number; // Grid size in seconds (default: 0.5)
}

export const TextTimelineTrack = ({
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlay,
  scale,
  timelineWidth,
  onDragStart,
  onDragEnd,
  snapToGrid = true,
  gridSize = 0.25, // Default to 0.25 second grid
}: TextTimelineTrackProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    overlayId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStartTime: number;
    originalDuration: number;
  } | null>(null);

  // Snap time to grid
  const snapTime = useCallback(
    (time: number): number => {
      if (!snapToGrid) return time;
      return Math.round(time / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

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

  // Handle drag start for moving
  const handleDragStart = useCallback(
    (e: React.MouseEvent, overlayId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const overlay = overlays.find((o) => o.id === overlayId);
      if (!overlay) return;

      onDragStart?.();
      onSelectOverlay(overlayId);

      setDragState({
        overlayId,
        type: 'move',
        startX: e.clientX,
        originalStartTime: overlay.startTime,
        originalDuration: overlay.duration,
      });
    },
    [overlays, onDragStart, onSelectOverlay]
  );

  // Handle drag start for resizing
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, overlayId: string, edge: 'start' | 'end') => {
      e.preventDefault();
      e.stopPropagation();

      const overlay = overlays.find((o) => o.id === overlayId);
      if (!overlay) return;

      onDragStart?.();
      onSelectOverlay(overlayId);

      setDragState({
        overlayId,
        type: edge === 'start' ? 'resize-start' : 'resize-end',
        startX: e.clientX,
        originalStartTime: overlay.startTime,
        originalDuration: overlay.duration,
      });
    },
    [overlays, onDragStart, onSelectOverlay]
  );

  // Handle mouse move and up
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / scale;

      const overlay = overlays.find((o) => o.id === dragState.overlayId);
      if (!overlay) return;

      if (dragState.type === 'move') {
        const rawTime = dragState.originalStartTime + deltaTime;
        const newStartTime = snapTime(Math.max(0, rawTime));
        onUpdateOverlay(dragState.overlayId, { startTime: newStartTime });
      } else if (dragState.type === 'resize-start') {
        const rawTime = dragState.originalStartTime + deltaTime;
        const newStartTime = snapTime(Math.max(0, rawTime));
        const maxStart = dragState.originalStartTime + dragState.originalDuration - 0.5;
        const clampedStart = Math.min(newStartTime, maxStart);
        const newDuration = snapTime(
          dragState.originalDuration - (clampedStart - dragState.originalStartTime)
        );
        onUpdateOverlay(dragState.overlayId, {
          startTime: clampedStart,
          duration: Math.max(0.25, newDuration),
        });
      } else if (dragState.type === 'resize-end') {
        const rawDuration = dragState.originalDuration + deltaTime;
        const newDuration = snapTime(Math.max(0.25, rawDuration));
        onUpdateOverlay(dragState.overlayId, { duration: newDuration });
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
  }, [dragState, overlays, scale, onUpdateOverlay, onDragEnd, snapTime]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div
      ref={trackRef}
      className="relative h-10 bg-purple-900/10"
      style={{ width: timelineWidth }}
    >
      {/* Text overlay items */}
      {overlays.map((overlay) => {
        const left = timeToPixel(overlay.startTime);
        const width = timeToPixel(overlay.duration);
        const isSelected = selectedOverlayId === overlay.id;
        const isBeingDragged = dragState?.overlayId === overlay.id;

        return (
          <div
            key={overlay.id}
            className={`absolute top-1 h-8 rounded border-2 transition-all overflow-hidden cursor-grab active:cursor-grabbing ${
              isSelected
                ? 'border-purple-400 bg-purple-500/40 z-20'
                : 'border-purple-500/50 bg-purple-500/20 hover:border-purple-400'
            } ${isBeingDragged ? 'shadow-lg shadow-purple-500/30' : ''}`}
            style={{
              left: left,
              width: Math.max(width, 40),
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectOverlay(overlay.id);
            }}
          >
            {/* Drag handle - main content area */}
            <div
              className="absolute inset-0 flex items-center px-3"
              onMouseDown={(e) => handleDragStart(e, overlay.id)}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <GripVertical className="w-3 h-3 text-purple-300 opacity-50 flex-shrink-0" />
                <span className="text-[11px] text-purple-100 truncate font-medium">
                  {overlay.text.trim() ? overlay.text.split('\n')[0].substring(0, 20) : 'Empty'}
                  {overlay.text.length > 20 ? '...' : ''}
                </span>
              </div>
              <span className="text-[9px] text-purple-300/70 flex-shrink-0 ml-1">
                {formatTime(overlay.duration)}
              </span>
            </div>

            {/* Resize handles - more visible */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:w-2 transition-all group"
              onMouseDown={(e) => handleResizeStart(e, overlay.id, 'start')}
            >
              <div className="absolute inset-y-1 left-0.5 w-1 bg-purple-300/60 rounded-full group-hover:bg-purple-200" />
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:w-2 transition-all group"
              onMouseDown={(e) => handleResizeStart(e, overlay.id, 'end')}
            >
              <div className="absolute inset-y-1 right-0.5 w-1 bg-purple-300/60 rounded-full group-hover:bg-purple-200" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TextTimelineTrack;
