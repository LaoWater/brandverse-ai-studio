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
// TRANSITION TYPES
// ============================================

/**
 * Available transition types
 * These map to FFmpeg xfade transition names
 */
export type TransitionType =
  | 'none'
  | 'fade'
  | 'fadeblack'
  | 'fadewhite'
  | 'dissolve'
  | 'wipeleft'
  | 'wiperight'
  | 'wipeup'
  | 'wipedown'
  | 'slideleft'
  | 'slideright'
  | 'slideup'
  | 'slidedown'
  | 'circlecrop'
  | 'rectcrop'
  | 'circleopen'
  | 'circleclose'
  | 'pixelize'
  | 'radial'
  | 'smoothleft'
  | 'smoothright'
  | 'smoothup'
  | 'smoothdown';

/**
 * Transition configuration between two clips
 */
export interface ClipTransition {
  type: TransitionType;
  duration: number; // 0.1 - 2.0 seconds
}

/**
 * Default transition settings
 */
export const DEFAULT_TRANSITION: ClipTransition = {
  type: 'fade',
  duration: 0.5,
};

/**
 * Transition type metadata for UI display
 */
export interface TransitionTypeInfo {
  type: TransitionType;
  label: string;
  description: string;
  category: 'basic' | 'wipe' | 'slide' | 'shape' | 'special';
}

/**
 * All available transitions with metadata
 */
export const TRANSITION_TYPES: TransitionTypeInfo[] = [
  { type: 'none', label: 'None', description: 'No transition (hard cut)', category: 'basic' },
  { type: 'fade', label: 'Fade', description: 'Crossfade between clips', category: 'basic' },
  { type: 'fadeblack', label: 'Fade to Black', description: 'Fade through black', category: 'basic' },
  { type: 'fadewhite', label: 'Fade to White', description: 'Fade through white', category: 'basic' },
  { type: 'dissolve', label: 'Dissolve', description: 'Pixel dissolve effect', category: 'basic' },
  { type: 'wipeleft', label: 'Wipe Left', description: 'Wipe from right to left', category: 'wipe' },
  { type: 'wiperight', label: 'Wipe Right', description: 'Wipe from left to right', category: 'wipe' },
  { type: 'wipeup', label: 'Wipe Up', description: 'Wipe from bottom to top', category: 'wipe' },
  { type: 'wipedown', label: 'Wipe Down', description: 'Wipe from top to bottom', category: 'wipe' },
  { type: 'slideleft', label: 'Slide Left', description: 'Next clip slides in from right', category: 'slide' },
  { type: 'slideright', label: 'Slide Right', description: 'Next clip slides in from left', category: 'slide' },
  { type: 'slideup', label: 'Slide Up', description: 'Next clip slides in from bottom', category: 'slide' },
  { type: 'slidedown', label: 'Slide Down', description: 'Next clip slides in from top', category: 'slide' },
  { type: 'circlecrop', label: 'Circle Crop', description: 'Circle reveal transition', category: 'shape' },
  { type: 'rectcrop', label: 'Rect Crop', description: 'Rectangle reveal transition', category: 'shape' },
  { type: 'circleopen', label: 'Circle Open', description: 'Expanding circle reveal', category: 'shape' },
  { type: 'circleclose', label: 'Circle Close', description: 'Shrinking circle reveal', category: 'shape' },
  { type: 'pixelize', label: 'Pixelize', description: 'Pixelated transition', category: 'special' },
  { type: 'radial', label: 'Radial', description: 'Radial wipe transition', category: 'special' },
  { type: 'smoothleft', label: 'Smooth Left', description: 'Smooth slide left', category: 'slide' },
  { type: 'smoothright', label: 'Smooth Right', description: 'Smooth slide right', category: 'slide' },
  { type: 'smoothup', label: 'Smooth Up', description: 'Smooth slide up', category: 'slide' },
  { type: 'smoothdown', label: 'Smooth Down', description: 'Smooth slide down', category: 'slide' },
];

/**
 * Get transition info by type
 */
export const getTransitionInfo = (type: TransitionType): TransitionTypeInfo | undefined => {
  return TRANSITION_TYPES.find(t => t.type === type);
};

/**
 * Get transitions by category
 */
export const getTransitionsByCategory = (category: TransitionTypeInfo['category']): TransitionTypeInfo[] => {
  return TRANSITION_TYPES.filter(t => t.category === category);
};

// ============================================
// VIDEO CLIP TYPES
// ============================================

/**
 * Audio information for a clip
 */
export interface ClipAudioInfo {
  hasAudio: boolean;          // Whether the clip has an audio track
  volume: number;             // Volume level 0-1
  muted: boolean;             // Whether audio is muted
  waveformUrl?: string;       // URL to waveform data (future enhancement)
}

/**
 * Default audio info for new clips
 */
export const DEFAULT_AUDIO_INFO: ClipAudioInfo = {
  hasAudio: true,             // Assume clips have audio by default
  volume: 1,
  muted: false,
};

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

  // Transition to NEXT clip (outgoing transition)
  // Applied between this clip and the following clip
  transitionOut?: ClipTransition;

  // Audio properties
  audioInfo?: ClipAudioInfo;
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

// ============================================
// CAPTION TYPES
// ============================================

/**
 * Caption style configuration
 */
export interface CaptionStyle {
  fontSize: number;           // 16-48px typically
  fontColor: string;          // Hex color
  backgroundColor?: string;   // Optional background (semi-transparent)
  position: 'top' | 'center' | 'bottom';
}

/**
 * Default caption style
 */
export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontSize: 24,
  fontColor: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  position: 'bottom',
};

/**
 * A single caption segment with timing
 */
export interface CaptionSegment {
  id: string;
  startTime: number;          // When caption appears (seconds)
  endTime: number;            // When caption disappears (seconds)
  text: string;               // Caption text
  style?: CaptionStyle;       // Optional per-segment style override
}

/**
 * Create a new caption segment
 */
export const createCaptionSegment = (
  startTime: number,
  endTime: number,
  text: string
): CaptionSegment => ({
  id: `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  startTime,
  endTime,
  text,
});

/**
 * Transcript segment from speech-to-text (Whisper)
 */
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}
