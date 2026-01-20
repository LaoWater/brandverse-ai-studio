import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Film, GripVertical, Scissors, SplitSquareHorizontal, Trash2, Undo2, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditorClip, TextOverlay, ClipTransition } from '@/types/editor';
import { getEffectiveDuration, getClipEndTime } from '@/types/editor';
import { TextTimelineTrack } from './text-overlay';
import { TransitionIndicator } from './transitions';

interface EditorTimelineProps {
  clips: EditorClip[];
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  onChange: (clips: EditorClip[]) => void;
  onDragStart?: () => void; // Called when drag/resize starts - save state for undo
  onDragEnd?: () => void; // Called when drag/resize ends - commit to history
  onDeleteClip: (clipId: string) => void;
  onSplitClip?: (clipId: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  // Text overlay props
  textOverlays?: TextOverlay[];
  selectedTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  onUpdateText?: (id: string, updates: Partial<TextOverlay>) => void;
  // Transition props
  selectedTransitionIndex?: number | null;
  onSelectTransition?: (index: number | null) => void;
  onUpdateTransition?: (clipIndex: number, transition: ClipTransition | undefined) => void;
}

export const EditorTimeline = ({
  clips,
  currentTime,
  totalDuration,
  onSeek,
  onChange,
  onDragStart,
  onDragEnd,
  onDeleteClip,
  onSplitClip,
  onUndo,
  canUndo,
  textOverlays = [],
  selectedTextId,
  onSelectText,
  onUpdateText,
  // Transition props
  selectedTransitionIndex,
  onSelectTransition,
  onUpdateTransition,
}: EditorTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [resizeClipId, setResizeClipId] = useState<string | null>(null);
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Scale: pixels per second (adjustable for zoom)
  const [scale, setScale] = useState(50);
  const minDuration = Math.max(totalDuration, 30); // Minimum 30s timeline width
  const timelineWidth = minDuration * scale;

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => {
    return time * scale;
  }, [scale]);

  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    return Math.max(0, (pixel - rect.left + scrollLeft) / scale);
  }, [scale]);

  // Handle clicking on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || resizeClipId) return;
    const time = pixelToTime(e.clientX);
    onSeek(time);
  }, [isDragging, resizeClipId, pixelToTime, onSeek]);

  // Handle playhead dragging
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // Handle clip drag start
  const handleClipDragStart = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    onDragStart?.(); // Save state before drag for undo
    setDragClipId(clipId);
    setIsDragging(true);
  }, [onDragStart]);

  // Handle resize handle drag start
  const handleResizeStart = useCallback((e: React.MouseEvent, clipId: string, edge: 'start' | 'end') => {
    e.stopPropagation();
    onDragStart?.(); // Save state before resize for undo
    setResizeClipId(clipId);
    setResizeEdge(edge);
    setIsDragging(true);
  }, [onDragStart]);

  // Global mouse move handler
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const time = pixelToTime(e.clientX);

      if (resizeClipId && resizeEdge) {
        // Handle resizing (trimming)
        onChange(clips.map(clip => {
          if (clip.id !== resizeClipId) return clip;

          const effectiveDuration = getEffectiveDuration(clip);

          if (resizeEdge === 'start') {
            // Trim from start
            const newStartTime = Math.max(0, Math.min(time, getClipEndTime(clip) - 0.5));
            const deltaStart = newStartTime - clip.startTime;
            const newTrimStart = Math.max(0, Math.min(clip.trimStart + deltaStart, clip.sourceDuration - 0.5));

            return {
              ...clip,
              startTime: newStartTime,
              trimStart: newTrimStart,
            };
          } else {
            // Trim from end
            const clipEnd = getClipEndTime(clip);
            const newEndTime = Math.max(clip.startTime + 0.5, time);
            const deltaEnd = clipEnd - newEndTime;
            const newTrimEnd = Math.max(0, Math.min(clip.trimEnd + deltaEnd, clip.sourceDuration - clip.trimStart - 0.5));

            return {
              ...clip,
              trimEnd: newTrimEnd,
            };
          }
        }));
      } else if (dragClipId) {
        // Handle clip dragging - calculate drop target index
        const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
        let targetIndex = sortedClips.length; // Default to end

        for (let i = 0; i < sortedClips.length; i++) {
          const clipMidpoint = sortedClips[i].startTime + getEffectiveDuration(sortedClips[i]) / 2;
          if (time < clipMidpoint) {
            targetIndex = i;
            break;
          }
        }

        // Don't show drop indicator at clip's own position or adjacent positions
        const dragClipIndex = sortedClips.findIndex(c => c.id === dragClipId);
        if (targetIndex === dragClipIndex || targetIndex === dragClipIndex + 1) {
          setDropTargetIndex(null);
        } else {
          setDropTargetIndex(targetIndex);
        }

        // Update clip position for visual feedback
        onChange(clips.map(clip => {
          if (clip.id !== dragClipId) return clip;
          return {
            ...clip,
            startTime: Math.max(0, time),
          };
        }));
      } else {
        // Handle playhead dragging
        onSeek(Math.max(0, Math.min(time, totalDuration)));
      }
    };

    const handleMouseUp = () => {
      const wasDragging = dragClipId || resizeClipId;

      if (dragClipId) {
        // Reorder clips based on drop position
        const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
        const draggedClip = sortedClips.find(c => c.id === dragClipId);

        if (draggedClip && dropTargetIndex !== null) {
          // Remove dragged clip from current position
          const otherClips = sortedClips.filter(c => c.id !== dragClipId);
          // Insert at new position
          const newClips = [
            ...otherClips.slice(0, dropTargetIndex > sortedClips.indexOf(draggedClip) ? dropTargetIndex - 1 : dropTargetIndex),
            draggedClip,
            ...otherClips.slice(dropTargetIndex > sortedClips.indexOf(draggedClip) ? dropTargetIndex - 1 : dropTargetIndex),
          ];

          // Recalculate start times
          let currentStart = 0;
          const reorderedClips = newClips.map(clip => {
            const newClip = { ...clip, startTime: currentStart };
            currentStart += getEffectiveDuration(clip);
            return newClip;
          });
          onChange(reorderedClips);
        } else {
          // No valid drop target - snap back to sorted order
          let currentStart = 0;
          const snappedClips = sortedClips.map(clip => {
            const newClip = { ...clip, startTime: currentStart };
            currentStart += getEffectiveDuration(clip);
            return newClip;
          });
          onChange(snappedClips);
        }
      }

      setIsDragging(false);
      setDragClipId(null);
      setResizeClipId(null);
      setResizeEdge(null);
      setDropTargetIndex(null);

      // Signal drag/resize completed - commit to history
      if (wasDragging) {
        onDragEnd?.();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragClipId, resizeClipId, resizeEdge, clips, totalDuration, pixelToTime, onChange, onSeek]);

  // Generate time markers
  const timeMarkers = [];
  const markerInterval = scale >= 30 ? 5 : 10; // 5s or 10s intervals
  for (let t = 0; t <= minDuration; t += markerInterval) {
    timeMarkers.push(t);
  }

  // Find the clip that's currently under the playhead
  const clipUnderPlayhead = useMemo(() => {
    return clips.find(clip => {
      const clipEnd = getClipEndTime(clip);
      return currentTime >= clip.startTime && currentTime < clipEnd;
    });
  }, [clips, currentTime]);

  // Check if split is possible (playhead not at clip boundaries)
  const canSplit = useMemo(() => {
    if (!clipUnderPlayhead) return false;
    const clipLocalTime = currentTime - clipUnderPlayhead.startTime;
    const effectiveDuration = getEffectiveDuration(clipUnderPlayhead);
    return clipLocalTime > 0.1 && clipLocalTime < effectiveDuration - 0.1;
  }, [clipUnderPlayhead, currentTime]);

  // Format time for markers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="space-y-2">
      {/* Timeline Header with zoom controls */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">Timeline</span>
          {/* Split button - only show when a clip is under the playhead */}
          {onSplitClip && clipUnderPlayhead && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSplitClip(clipUnderPlayhead.id)}
              disabled={!canSplit}
              className={`h-7 px-2 text-xs ${canSplit ? 'border-accent text-accent hover:bg-accent/20' : 'opacity-50'}`}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5 mr-1" />
              Split
            </Button>
          )}
          {/* Delete button - only show when a clip is under the playhead */}
          {clipUnderPlayhead && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteClip(clipUnderPlayhead.id)}
              className="h-7 px-2 text-xs border-destructive/50 text-destructive hover:bg-destructive/20"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete
            </Button>
          )}
          {/* Undo button */}
          {onUndo && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-7 px-2 text-xs border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5 mr-1" />
              Undo
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(20, s - 10))}
            className="px-2 py-1 text-gray-400 hover:text-white bg-white/5 rounded"
          >
            -
          </button>
          <span className="text-gray-400 w-16 text-center">{Math.round(scale)}px/s</span>
          <button
            onClick={() => setScale(s => Math.min(100, s + 10))}
            className="px-2 py-1 text-gray-400 hover:text-white bg-white/5 rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className={`relative bg-black/30 rounded-lg overflow-x-auto overflow-y-hidden cursor-pointer ${
          textOverlays.length > 0 ? 'h-44' : 'h-32'
        }`}
        onClick={handleTimelineClick}
        style={{ minWidth: '100%' }}
      >
        <div style={{ width: timelineWidth, minWidth: '100%' }} className="h-full relative">
          {/* Time Ruler */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-black/20 border-b border-white/10">
            {timeMarkers.map(time => (
              <div
                key={time}
                className="absolute top-0 h-full flex flex-col items-center"
                style={{ left: timeToPixel(time) }}
              >
                <div className="w-px h-2 bg-white/30" />
                <span className="text-[10px] text-gray-500 mt-0.5">{formatTime(time)}</span>
              </div>
            ))}
          </div>

          {/* Video Track Area */}
          <div className="absolute top-6 left-0 right-0 h-20 p-2">
            {/* Empty state */}
            {clips.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                <Film className="w-5 h-5 mr-2 opacity-50" />
                Add clips to start editing
              </div>
            )}

            {/* Drop zone indicators */}
            {dragClipId && clips.length > 0 && (() => {
              const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
              const dropZones: JSX.Element[] = [];

              // Add drop zone at the beginning
              if (dropTargetIndex === 0) {
                dropZones.push(
                  <div
                    key="drop-0"
                    className="absolute top-2 h-16 w-1 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50"
                    style={{ left: 0 }}
                  />
                );
              }

              // Add drop zones between clips
              sortedClips.forEach((clip, idx) => {
                if (clip.id === dragClipId) return;
                const clipEnd = getClipEndTime(clip);
                const isDropTarget = dropTargetIndex === idx + 1;

                if (isDropTarget) {
                  dropZones.push(
                    <div
                      key={`drop-${idx + 1}`}
                      className="absolute top-2 h-16 w-1 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50"
                      style={{ left: timeToPixel(clipEnd) }}
                    />
                  );
                }
              });

              return dropZones;
            })()}

            {/* Clips */}
            {clips.map((clip, index) => {
              const effectiveDuration = getEffectiveDuration(clip);
              const clipLeft = timeToPixel(clip.startTime);
              const clipWidth = timeToPixel(effectiveDuration);
              const isBeingDragged = dragClipId === clip.id;
              const isActive = isBeingDragged || resizeClipId === clip.id;

              return (
                <div
                  key={clip.id}
                  className={`absolute top-2 h-16 rounded-md border-2 transition-all overflow-hidden ${
                    isBeingDragged
                      ? 'border-primary bg-primary/30 z-20 opacity-70 shadow-xl shadow-primary/30'
                      : isActive
                      ? 'border-primary bg-primary/30 z-10'
                      : 'border-accent/50 bg-accent/20 hover:border-accent'
                  }`}
                  style={{
                    left: clipLeft,
                    width: Math.max(clipWidth, 40),
                    transform: isBeingDragged ? 'scale(1.02)' : undefined,
                  }}
                >
                  {/* Drag handle */}
                  <div
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleClipDragStart(e, clip.id)}
                  >
                    {/* Thumbnail */}
                    {clip.thumbnailUrl && (
                      <img
                        src={clip.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        draggable={false}
                      />
                    )}

                    {/* Clip info */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="text-center">
                        <p className="text-xs font-medium text-white truncate px-2">
                          {clip.fileName || `Clip ${index + 1}`}
                        </p>
                        <p className="text-[10px] text-gray-300">
                          {formatTime(effectiveDuration)}
                        </p>
                      </div>
                    </div>

                    {/* Drag indicator */}
                    <div className="absolute top-1/2 left-2 -translate-y-1/2 text-white/50">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Trim handles */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-accent/50 hover:bg-accent/80 flex items-center justify-center group"
                    onMouseDown={(e) => handleResizeStart(e, clip.id, 'start')}
                  >
                    <Scissors className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 rotate-90" />
                  </div>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-accent/50 hover:bg-accent/80 flex items-center justify-center group"
                    onMouseDown={(e) => handleResizeStart(e, clip.id, 'end')}
                  >
                    <Scissors className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 rotate-90" />
                  </div>
                </div>
              );
            })}

            {/* Transition Indicators between clips */}
            {clips.length > 1 && onSelectTransition && (
              <>
                {clips.slice(0, -1).map((clip, index) => {
                  const clipEndTime = getClipEndTime(clip);
                  const position = timeToPixel(clipEndTime);

                  return (
                    <TransitionIndicator
                      key={`transition-${clip.id}`}
                      transition={clip.transitionOut}
                      position={position}
                      scale={scale}
                      isSelected={selectedTransitionIndex === index}
                      onClick={() => {
                        onSelectTransition(selectedTransitionIndex === index ? null : index);
                      }}
                    />
                  );
                })}
              </>
            )}
          </div>

          {/* Text Track Area */}
          {textOverlays.length > 0 && onSelectText && onUpdateText && (
            <div className="absolute top-[6.5rem] left-0 right-0 h-12 border-t border-white/10">
              <TextTimelineTrack
                overlays={textOverlays}
                selectedOverlayId={selectedTextId ?? null}
                onSelectOverlay={onSelectText}
                onUpdateOverlay={onUpdateText}
                scale={scale}
                timelineWidth={timelineWidth}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            </div>
          )}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 cursor-ew-resize"
            style={{ left: timeToPixel(currentTime) }}
            onMouseDown={handlePlayheadMouseDown}
          >
            {/* Playhead handle */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" />
            {/* Time indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-1 rounded whitespace-nowrap">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Drag clips to reorder</span>
        <span>•</span>
        <span>Drag edges to trim</span>
        <span>•</span>
        <span>Click timeline to seek</span>
        {onSplitClip && (
          <>
            <span>•</span>
            <span>Click Split to divide clip at playhead</span>
          </>
        )}
        {onSelectTransition && clips.length > 1 && (
          <>
            <span>•</span>
            <span>Click between clips to add transitions</span>
          </>
        )}
      </div>
    </div>
  );
};

export default EditorTimeline;
