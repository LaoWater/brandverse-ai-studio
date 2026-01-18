// ============================================
// VIDEO EDITOR TYPES
// For the Media Studio video editor feature
// ============================================

// ============================================
// TEXT OVERLAY TYPES
// ============================================

/**
 * Available font families for text overlays
 * These must match fonts bundled in the media processing service
 */
export type FontFamily =
  | 'Inter'
  | 'Montserrat'
  | 'Roboto'
  | 'Playfair Display'
  | 'Oswald'
  | 'Open Sans'
  | 'Lato'
  | 'Poppins';

/**
 * Text style configuration
 */
export interface TextStyle {
  fontFamily: FontFamily;
  fontSize: number;         // 12-120px
  fontWeight: 'normal' | 'bold' | 'light';
  color: string;            // Hex '#FFFFFF'
  backgroundColor?: string; // Optional background color
  backgroundPadding?: number; // Padding around text when background is set
  textAlign: 'left' | 'center' | 'right';
  opacity: number;          // 0-1
}

/**
 * Default text style
 */
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 32,
  fontWeight: 'normal',
  color: '#FFFFFF',
  textAlign: 'center',
  opacity: 1,
};

/**
 * Text overlay interface
 * Represents a text element that appears on the video
 */
export interface TextOverlay {
  id: string;
  type: 'text';
  startTime: number;        // When text appears (seconds)
  duration: number;         // How long it shows (seconds)
  text: string;             // Multi-line supported
  position: { x: number; y: number };  // Percentages 0-100
  style: TextStyle;
}

/**
 * Create a new text overlay with default values
 */
export const createTextOverlay = (
  startTime: number = 0,
  duration: number = 3
): TextOverlay => ({
  id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'text',
  startTime,
  duration,
  text: 'New Text',
  position: { x: 50, y: 50 }, // Centered
  style: { ...DEFAULT_TEXT_STYLE },
});

/**
 * Check if a text overlay is visible at a given time
 */
export const isTextOverlayVisible = (overlay: TextOverlay, time: number): boolean => {
  return time >= overlay.startTime && time < overlay.startTime + overlay.duration;
};

// ============================================
// VIDEO CLIP TYPES
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
