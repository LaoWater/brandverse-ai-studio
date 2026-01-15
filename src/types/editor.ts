// ============================================
// VIDEO EDITOR TYPES
// For the Media Studio video editor feature
// ============================================

/**
 * Represents a video clip on the editor timeline
 */
export interface EditorClip {
  id: string;
  mediaFileId: string;        // Reference to media_files table
  sourceUrl: string;          // Video URL from library
  thumbnailUrl: string | null;
  fileName: string;           // Original file name for display
  sourceDuration: number;     // Original video duration (seconds)

  // Timeline position (where clip starts on timeline)
  startTime: number;          // Position on timeline (seconds)

  // Trim points (non-destructive until export)
  trimStart: number;          // Trim from beginning (seconds)
  trimEnd: number;            // Trim from end (seconds)
}

/**
 * Calculate the effective duration of a clip after trimming
 */
export const getEffectiveDuration = (clip: EditorClip): number => {
  return clip.sourceDuration - clip.trimStart - clip.trimEnd;
};

/**
 * Calculate the end time of a clip on the timeline
 */
export const getClipEndTime = (clip: EditorClip): number => {
  return clip.startTime + getEffectiveDuration(clip);
};

/**
 * Playback state for the editor preview
 */
export interface PlaybackState {
  playing: boolean;
  currentTime: number;        // Timeline position (seconds)
  activeClipId: string | null; // Which clip is currently playing
}

/**
 * Export state for progress tracking
 */
export interface ExportState {
  exporting: boolean;
  progress: number;           // 0-100
  stage: ExportStage;
  error: string | null;
}

export type ExportStage =
  | 'idle'
  | 'preparing'
  | 'loading-ffmpeg'
  | 'downloading-videos'
  | 'trimming'
  | 'concatenating'
  | 'finalizing'
  | 'uploading'
  | 'complete'
  | 'error';

/**
 * Timeline action for react-timeline-editor
 * Maps our EditorClip to the library's expected format
 */
export interface TimelineAction {
  id: string;
  start: number;              // Timeline start position
  end: number;                // Timeline end position
  effectId: string;           // Effect type identifier
  // Custom data attached to the action
  data?: {
    clip: EditorClip;
  };
}

/**
 * Timeline row for react-timeline-editor
 */
export interface TimelineRow {
  id: string;
  actions: TimelineAction[];
}

/**
 * Timeline effect definition
 */
export interface TimelineEffect {
  id: string;
  name: string;
}

/**
 * Convert EditorClip to TimelineAction format
 */
export const clipToTimelineAction = (clip: EditorClip): TimelineAction => {
  const effectiveDuration = getEffectiveDuration(clip);
  return {
    id: clip.id,
    start: clip.startTime,
    end: clip.startTime + effectiveDuration,
    effectId: 'video',
    data: { clip },
  };
};

/**
 * Convert TimelineAction back to EditorClip with updated positions
 */
export const timelineActionToClip = (
  action: TimelineAction,
  originalClip: EditorClip
): EditorClip => {
  const newDuration = action.end - action.start;
  const originalEffectiveDuration = getEffectiveDuration(originalClip);

  // Calculate trim changes based on resize
  const durationChange = originalEffectiveDuration - newDuration;

  return {
    ...originalClip,
    startTime: action.start,
    // If duration changed, it was trimmed - split the trim between start and end
    // For now, assume resize from right edge affects trimEnd
    trimEnd: originalClip.trimEnd + durationChange,
  };
};

/**
 * Editor view mode (for Media Studio integration)
 */
export type MediaStudioView = 'create' | 'library' | 'editor';
