// ============================================
// AUDIO SERVICE
// Handles audio extraction and transcription via Cloud Run
// ============================================

import type { TranscriptSegment, CaptionSegment } from '@/types/editor';

/**
 * Media Processing Service URL
 */
const MEDIA_PROCESSING_SERVICE_URL = import.meta.env.VITE_MEDIA_PROCESSING_URL ||
  'https://media-processing-svc-2z5w4pckxq-lm.a.run.app';

// ============================================
// Types
// ============================================

export interface AudioExtractResult {
  audioUrl: string;
  duration: number;
  fileSize: number;
}

export interface TranscribeResult {
  srtUrl: string;
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  language: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Extract audio from a video file.
 *
 * @param videoUrl - URL of the video to extract audio from
 * @param userId - User ID for storage path
 * @param outputFormat - 'mp3' (smaller, lossy) or 'wav' (larger, lossless)
 */
export const extractAudio = async (
  videoUrl: string,
  userId: string,
  outputFormat: 'mp3' | 'wav' = 'mp3'
): Promise<AudioExtractResult> => {
  console.log('[AudioService] Extracting audio from:', videoUrl);

  const response = await fetch(`${MEDIA_PROCESSING_SERVICE_URL}/audio/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoUrl,
      userId,
      outputFormat,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Audio extraction failed: ${errorText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Audio extraction failed');
  }

  console.log('[AudioService] Audio extracted:', result.audioUrl);

  return {
    audioUrl: result.audioUrl,
    duration: result.duration,
    fileSize: result.fileSize,
  };
};

/**
 * Transcribe audio to text using OpenAI Whisper.
 *
 * @param audioUrl - URL of the audio file (can also be a video URL)
 * @param userId - User ID for storage path
 * @param language - Optional language code (auto-detected if not specified)
 */
export const transcribeAudio = async (
  audioUrl: string,
  userId: string,
  language?: string
): Promise<TranscribeResult> => {
  console.log('[AudioService] Transcribing audio:', audioUrl);

  const response = await fetch(`${MEDIA_PROCESSING_SERVICE_URL}/audio/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioUrl,
      userId,
      language,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcription failed: ${errorText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Transcription failed');
  }

  console.log('[AudioService] Transcription complete:', result.transcript?.substring(0, 100));

  return {
    srtUrl: result.srtUrl,
    transcript: result.transcript,
    segments: result.segments,
    duration: result.duration,
    language: result.language,
  };
};

/**
 * Convert transcript segments to caption segments for the editor.
 *
 * @param segments - Transcript segments from Whisper
 * @param timeOffset - Optional time offset to adjust segment times
 */
export const segmentsToCaptions = (
  segments: TranscriptSegment[],
  timeOffset: number = 0
): CaptionSegment[] => {
  return segments.map((segment, index) => ({
    id: `caption_${Date.now()}_${index}`,
    startTime: segment.start + timeOffset,
    endTime: segment.end + timeOffset,
    text: segment.text,
  }));
};

/**
 * Generate captions for a video (combines extraction + transcription).
 *
 * @param videoUrl - URL of the video
 * @param userId - User ID for storage
 * @param language - Optional language code
 */
export const generateCaptions = async (
  videoUrl: string,
  userId: string,
  language?: string
): Promise<{
  captions: CaptionSegment[];
  srtUrl: string;
  transcript: string;
}> => {
  console.log('[AudioService] Generating captions for video:', videoUrl);

  // Transcribe directly from video (backend will extract audio automatically)
  const result = await transcribeAudio(videoUrl, userId, language);

  // Convert to caption segments
  const captions = segmentsToCaptions(result.segments);

  console.log('[AudioService] Generated', captions.length, 'caption segments');

  return {
    captions,
    srtUrl: result.srtUrl,
    transcript: result.transcript,
  };
};
