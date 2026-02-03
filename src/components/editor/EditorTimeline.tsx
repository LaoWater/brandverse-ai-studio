import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Film, GripVertical, Scissors, SplitSquareHorizontal, Trash2, Undo2, Type, Sparkles, Music, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditorClip, TextOverlay, ClipTransition, CaptionSegment, AudioSegment } from '@/types/editor';
import { getEffectiveDuration, getClipEndTime } from '@/types/editor';
import { TextTimelineTrack } from './text-overlay';
import { TransitionIndicator } from './transitions';
import { AudioTimelineTrack } from './AudioTimelineTrack';
import { CaptionTimelineTrack } from './captions';

// Track label components (fixed position outside scrollable area)
const VideoTrackLabel = () => (
  <div className="h-20 w-16 flex items-center justify-center bg-slate-100 dark:bg-black/20 border-r border-slate-200 dark:border-white/10 flex-shrink-0">
    <Film className="w-3 h-3 text-primary mr-1" />
    <span className="text-[9px] text-primary font-medium">Video</span>
  </div>
);

const TextTrackLabel = () => (
  <div className="h-10 w-16 flex items-center justify-center bg-slate-100 dark:bg-black/20 border-r border-slate-200 dark:border-white/10 border-t flex-shrink-0">
    <Type className="w-3 h-3 text-purple-500 dark:text-purple-400 mr-1" />
    <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">Text</span>
  </div>
);

const AudioTrackLabel = () => (
  <div className="h-10 w-16 flex items-center justify-center bg-slate-100 dark:bg-black/20 border-r border-slate-200 dark:border-white/10 border-t flex-shrink-0">
    <Music className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">Audio</span>
  </div>
);

const CaptionTrackLabel = () => (
  <div className="h-10 w-16 flex items-center justify-center bg-slate-100 dark:bg-black/20 border-r border-slate-200 dark:border-white/10 border-t flex-shrink-0">
    <MessageSquare className="w-3 h-3 text-yellow-500 dark:text-yellow-400 mr-1" />
    <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-medium">Subs</span>
  </div>
);

// Local state for trim adjustments during drag (prevents re-render cascade)
interface LocalTrimAdjustment {
  clipId: string;
  trimStart?: number;
  trimEnd?: number;
  startTime?: number;
}

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
  // Audio props
  showAudioTrack?: boolean;
  selectedAudioClipId?: string | null;
  onSelectAudioClip?: (id: string | null) => void;
  onClipVolumeChange?: (clipId: string, volume: number) => void;
  onDetachAudio?: (clipId: string) => void;
  onReattachAudio?: (segmentId: string) => void;
  audioSegments?: AudioSegment[];
  videoRef?: React.RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
  // Caption props
  captions?: CaptionSegment[];
  selectedCaptionId?: string | null;
  onSelectCaption?: (id: string | null) => void;
  onUpdateCaption?: (id: string, updates: Partial<CaptionSegment>) => void;
  // Scale props (persisted per project)
  scale?: number;
  onScaleChange?: (scale: number) => void;
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
  // Audio props
  showAudioTrack = true,
  selectedAudioClipId,
  onSelectAudioClip,
  onClipVolumeChange,
  onDetachAudio,
  onReattachAudio,
  audioSegments = [],
  videoRef,
  isPlaying = false,
  // Caption props
  captions = [],
  selectedCaptionId,
  onSelectCaption,
  onUpdateCaption,
  // Scale props
  scale: externalScale,
  onScaleChange,
}: EditorTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [resizeClipId, setResizeClipId] = useState<string | null>(null);
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // LOCAL STATE FOR PERFORMANCE: These store visual-only changes during drag
  // They don't trigger parent re-renders - only update parent on drag end
  const [localDragOffset, setLocalDragOffset] = useState<number>(0); // Time offset for dragged clip
  const [localTrimAdjustment, setLocalTrimAdjustment] = useState<LocalTrimAdjustment | null>(null);
  const rafRef = useRef<number | null>(null); // For requestAnimationFrame throttling
  const dragStartTimeRef = useRef<number>(0); // Original time when drag started

  // Scale: pixels per second (controlled by parent when persisted, otherwise local)
  const [localScale, setLocalScale] = useState(50);
  const scale = externalScale ?? localScale;
  const setScale = useCallback((updater: number | ((prev: number) => number)) => {
    const newValue = typeof updater === 'function' ? updater(scale) : updater;
    const clamped = Math.max(20, Math.min(100, newValue));
    if (onScaleChange) {
      onScaleChange(clamped);
    } else {
      setLocalScale(clamped);
    }
  }, [scale, onScaleChange]);
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

    // Store original position for offset calculation
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      dragStartTimeRef.current = clip.startTime;
    }

    setDragClipId(clipId);
    setLocalDragOffset(0);
    setIsDragging(true);
  }, [onDragStart, clips]);

  // Handle resize handle drag start
  const handleResizeStart = useCallback((e: React.MouseEvent, clipId: string, edge: 'start' | 'end') => {
    e.stopPropagation();
    onDragStart?.(); // Save state before resize for undo
    setResizeClipId(clipId);
    setResizeEdge(edge);
    setIsDragging(true);
  }, [onDragStart]);

  // OPTIMIZED: Global mouse move handler with local state pattern
  // Uses requestAnimationFrame throttling and only updates parent on drag end
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel any pending RAF to prevent queue buildup
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Throttle updates with requestAnimationFrame for smooth 60fps
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const time = pixelToTime(e.clientX);

        if (resizeClipId && resizeEdge) {
          // Handle resizing (trimming) - UPDATE LOCAL STATE ONLY
          const clip = clips.find(c => c.id === resizeClipId);
          if (!clip) return;

          if (resizeEdge === 'start') {
            // Trim from start
            const newStartTime = Math.max(0, Math.min(time, getClipEndTime(clip) - 0.5));
            const deltaStart = newStartTime - clip.startTime;
            const newTrimStart = Math.max(0, Math.min(clip.trimStart + deltaStart, clip.sourceDuration - 0.5));

            setLocalTrimAdjustment({
              clipId: resizeClipId,
              startTime: newStartTime,
              trimStart: newTrimStart,
            });
          } else {
            // Trim from end
            const clipEnd = getClipEndTime(clip);
            const newEndTime = Math.max(clip.startTime + 0.5, time);
            const deltaEnd = clipEnd - newEndTime;
            const newTrimEnd = Math.max(0, Math.min(clip.trimEnd + deltaEnd, clip.sourceDuration - clip.trimStart - 0.5));

            setLocalTrimAdjustment({
              clipId: resizeClipId,
              trimEnd: newTrimEnd,
            });
          }
        } else if (dragClipId) {
          // Handle clip dragging - UPDATE LOCAL STATE ONLY
          const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
          let targetIndex = sortedClips.length;

          for (let i = 0; i < sortedClips.length; i++) {
            const clipMidpoint = sortedClips[i].startTime + getEffectiveDuration(sortedClips[i]) / 2;
            if (time < clipMidpoint) {
              targetIndex = i;
              break;
            }
          }

          const dragClipIndex = sortedClips.findIndex(c => c.id === dragClipId);
          if (targetIndex === dragClipIndex || targetIndex === dragClipIndex + 1) {
            setDropTargetIndex(null);
          } else {
            setDropTargetIndex(targetIndex);
          }

          // Store offset from original position (local state only)
          setLocalDragOffset(Math.max(0, time) - dragStartTimeRef.current);
        } else {
          // Handle playhead dragging - this can update parent immediately (lightweight)
          onSeek(Math.max(0, Math.min(time, totalDuration)));
        }
      });
    };

    const handleMouseUp = () => {
      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const wasDragging = dragClipId || resizeClipId;

      if (dragClipId) {
        // Apply drag changes to parent state
        const draggedClipCurrentTime = dragStartTimeRef.current + localDragOffset;
        const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
        const draggedClip = sortedClips.find(c => c.id === dragClipId);

        if (draggedClip && dropTargetIndex !== null) {
          const otherClips = sortedClips.filter(c => c.id !== dragClipId);
          const adjustedIndex = dropTargetIndex > sortedClips.indexOf(draggedClip) ? dropTargetIndex - 1 : dropTargetIndex;
          const newClips = [
            ...otherClips.slice(0, adjustedIndex),
            draggedClip,
            ...otherClips.slice(adjustedIndex),
          ];

          let currentStart = 0;
          const reorderedClips = newClips.map(clip => {
            const newClip = { ...clip, startTime: currentStart };
            currentStart += getEffectiveDuration(clip);
            return newClip;
          });
          onChange(reorderedClips);
        } else {
          // Snap back to sorted order
          let currentStart = 0;
          const snappedClips = sortedClips.map(clip => {
            const newClip = { ...clip, startTime: currentStart };
            currentStart += getEffectiveDuration(clip);
            return newClip;
          });
          onChange(snappedClips);
        }
      } else if (resizeClipId && localTrimAdjustment) {
        // Apply trim changes to parent state
        onChange(clips.map(clip => {
          if (clip.id !== resizeClipId) return clip;
          return {
            ...clip,
            ...(localTrimAdjustment.startTime !== undefined && { startTime: localTrimAdjustment.startTime }),
            ...(localTrimAdjustment.trimStart !== undefined && { trimStart: localTrimAdjustment.trimStart }),
            ...(localTrimAdjustment.trimEnd !== undefined && { trimEnd: localTrimAdjustment.trimEnd }),
          };
        }));
      }

      // Reset all drag state
      setIsDragging(false);
      setDragClipId(null);
      setResizeClipId(null);
      setResizeEdge(null);
      setDropTargetIndex(null);
      setLocalDragOffset(0);
      setLocalTrimAdjustment(null);

      if (wasDragging) {
        onDragEnd?.();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, dragClipId, resizeClipId, resizeEdge, clips, totalDuration, pixelToTime, onChange, onSeek, localDragOffset, localTrimAdjustment, dropTargetIndex]);

  // MEMOIZED: Generate time markers (expensive operation)
  const timeMarkers = useMemo(() => {
    const markers: number[] = [];
    const markerInterval = scale >= 30 ? 5 : 10; // 5s or 10s intervals
    for (let t = 0; t <= minDuration; t += markerInterval) {
      markers.push(t);
    }
    return markers;
  }, [scale, minDuration]);

  // MEMOIZED: Sorted clips for drop zone calculations
  const sortedClips = useMemo(() =>
    [...clips].sort((a, b) => a.startTime - b.startTime),
    [clips]
  );

  // Helper: Get display position for a clip (includes local drag offset)
  const getDisplayStartTime = useCallback((clip: EditorClip): number => {
    if (dragClipId === clip.id) {
      return dragStartTimeRef.current + localDragOffset;
    }
    if (localTrimAdjustment?.clipId === clip.id && localTrimAdjustment.startTime !== undefined) {
      return localTrimAdjustment.startTime;
    }
    return clip.startTime;
  }, [dragClipId, localDragOffset, localTrimAdjustment]);

  // Helper: Get display trim values for a clip
  const getDisplayTrim = useCallback((clip: EditorClip): { trimStart: number; trimEnd: number } => {
    if (localTrimAdjustment?.clipId === clip.id) {
      return {
        trimStart: localTrimAdjustment.trimStart ?? clip.trimStart,
        trimEnd: localTrimAdjustment.trimEnd ?? clip.trimEnd,
      };
    }
    return { trimStart: clip.trimStart, trimEnd: clip.trimEnd };
  }, [localTrimAdjustment]);

  // Helper: Get effective duration with local trim adjustments
  const getDisplayEffectiveDuration = useCallback((clip: EditorClip): number => {
    const { trimStart, trimEnd } = getDisplayTrim(clip);
    return clip.sourceDuration - trimStart - trimEnd;
  }, [getDisplayTrim]);

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

  // Format time for markers (memoized with useCallback)
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  }, []);

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

      {/* Timeline Container - flex layout with fixed labels + scrollable tracks */}
      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30">
        {/* Fixed Track Labels Column */}
        <div className="flex flex-col flex-shrink-0 z-10">
          {/* Ruler spacer */}
          <div className="h-6 w-16 bg-slate-100 dark:bg-black/20 border-r border-b border-slate-200 dark:border-white/10" />
          {/* Video track label */}
          <VideoTrackLabel />
          {/* Text track label */}
          {textOverlays.length > 0 && <TextTrackLabel />}
          {/* Audio track label */}
          {showAudioTrack && clips.length > 0 && <AudioTrackLabel />}
          {/* Caption track label */}
          {captions.length > 0 && <CaptionTrackLabel />}
        </div>

        {/* Scrollable Timeline Area */}
        <div
          ref={timelineRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden cursor-pointer"
          onClick={handleTimelineClick}
          style={{
            height: `${24 + 80 + (textOverlays.length > 0 ? 40 : 0) + (showAudioTrack && clips.length > 0 ? 40 : 0) + (captions.length > 0 ? 40 : 0)}px`
          }}
        >
          <div style={{ width: timelineWidth, minWidth: '100%' }} className="h-full relative">
            {/* Time Ruler */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-slate-100 dark:bg-black/20 border-b border-slate-200 dark:border-white/10">
              {timeMarkers.map(time => (
                <div
                  key={time}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: timeToPixel(time) }}
                >
                  <div className="w-px h-2 bg-slate-300 dark:bg-white/30" />
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">{formatTime(time)}</span>
                </div>
              ))}
            </div>

            {/* Video Track Area */}
            <div className="absolute top-6 left-0 right-0 h-20 p-2 bg-slate-50 dark:bg-transparent">
            {/* Empty state */}
            {clips.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                <Film className="w-5 h-5 mr-2 opacity-50" />
                Add clips to start editing
              </div>
            )}

            {/* Drop zone indicators - uses memoized sortedClips */}
            {dragClipId && clips.length > 0 && (() => {
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

              // Add drop zones between clips (excluding the dragged clip)
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
              // Use display helpers for local state (smooth dragging without parent re-renders)
              const displayStartTime = getDisplayStartTime(clip);
              const displayEffectiveDuration = getDisplayEffectiveDuration(clip);
              const clipLeft = timeToPixel(displayStartTime);
              const clipWidth = timeToPixel(displayEffectiveDuration);
              const isBeingDragged = dragClipId === clip.id;
              const isActive = isBeingDragged || resizeClipId === clip.id;

              return (
                <div
                  key={clip.id}
                  className={`absolute top-2 h-16 rounded-md border-2 transition-all overflow-hidden ${
                    isBeingDragged
                      ? 'border-primary bg-primary/40 z-20 opacity-80 shadow-xl shadow-primary/30'
                      : isActive
                      ? 'border-primary bg-primary/30 z-10'
                      : 'border-primary/60 bg-primary/20 dark:border-accent/50 dark:bg-accent/20 hover:border-primary dark:hover:border-accent'
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
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        draggable={false}
                      />
                    )}

                    {/* Clip info - visible text with proper contrast */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/30">
                      <div className="text-center">
                        <p className="text-xs font-medium text-white truncate px-2 drop-shadow-md">
                          {clip.fileName || `Clip ${index + 1}`}
                        </p>
                        <p className="text-[10px] text-gray-200 drop-shadow-md">
                          {formatTime(displayEffectiveDuration)}
                        </p>
                      </div>
                    </div>

                    {/* Drag indicator */}
                    <div className="absolute top-1/2 left-2 -translate-y-1/2 text-white/70">
                      <GripVertical className="w-4 h-4 drop-shadow-md" />
                    </div>
                  </div>

                  {/* Trim handles - more visible */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-primary/70 dark:bg-accent/50 hover:bg-primary dark:hover:bg-accent/80 flex items-center justify-center group"
                    onMouseDown={(e) => handleResizeStart(e, clip.id, 'start')}
                  >
                    <Scissors className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 rotate-90" />
                  </div>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-primary/70 dark:bg-accent/50 hover:bg-primary dark:hover:bg-accent/80 flex items-center justify-center group"
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

          {/* Text Track Area - positioned after video track (24px ruler + 80px video) */}
          {textOverlays.length > 0 && onSelectText && onUpdateText && (
            <div
              className="absolute left-0 right-0 h-10 border-t border-slate-200 dark:border-white/10 bg-purple-50/50 dark:bg-transparent"
              style={{ top: '104px' }}
            >
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

          {/* Audio Track Area - positioned after text track */}
          {showAudioTrack && clips.length > 0 && onClipVolumeChange && (
            <div
              className="absolute left-0 right-0 h-10 border-t border-slate-200 dark:border-white/10"
              style={{ top: `${104 + (textOverlays.length > 0 ? 40 : 0)}px` }}
            >
              <AudioTimelineTrack
                clips={clips}
                scale={scale}
                timelineWidth={timelineWidth}
                selectedClipId={selectedAudioClipId ?? null}
                onSelectClip={onSelectAudioClip || (() => {})}
                onVolumeChange={onClipVolumeChange}
                onDetachAudio={onDetachAudio}
                onReattachAudio={onReattachAudio}
                audioSegments={audioSegments}
                videoRef={videoRef}
                isPlaying={isPlaying}
              />
            </div>
          )}

          {/* Caption Track Area - positioned after audio track */}
          {captions.length > 0 && onSelectCaption && onUpdateCaption && (
            <div
              className="absolute left-0 right-0 h-10 border-t border-slate-200 dark:border-white/10"
              style={{
                top: `${104 + (textOverlays.length > 0 ? 40 : 0) + (showAudioTrack && clips.length > 0 ? 40 : 0)}px`
              }}
            >
              <CaptionTimelineTrack
                captions={captions}
                scale={scale}
                timelineWidth={timelineWidth}
                selectedCaptionId={selectedCaptionId ?? null}
                onSelectCaption={onSelectCaption}
                onUpdateCaption={onUpdateCaption}
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
