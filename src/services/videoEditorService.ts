// ============================================
// VIDEO EDITOR SERVICE
// Handles video export via server-side processing
// Uses Cloud Run media-processing-service for lossless FFmpeg operations
// ============================================

import type { EditorClip, ExportStage } from '@/types/editor';
import { getEffectiveDuration } from '@/types/editor';

/**
 * Media Processing Service URL
 * This should be set after deploying the Cloud Run service
 */
const MEDIA_PROCESSING_SERVICE_URL = import.meta.env.VITE_MEDIA_PROCESSING_URL ||
  'https://media-processing-svc-2z5w4pckxq-lm.a.run.app';

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number, stage: ExportStage, message?: string) => void;

/**
 * Export request payload for the media processing service
 */
interface ExportRequest {
  clips: {
    id: string;
    sourceUrl: string;
    sourceDuration: number;
    startTime: number;
    trimStart: number;
    trimEnd: number;
  }[];
  userId: string;
  companyId?: string;
  projectName?: string;
}

/**
 * Export response from the media processing service
 */
interface ExportResponse {
  success: boolean;
  videoUrl?: string;
  storagePath?: string;
  fileSize?: number;
  mediaFileId?: string;
  processingTimeMs?: number;
  error?: string;
}

/**
 * Export a complete project using the server-side media processing service.
 * Uses lossless FFmpeg operations (stream copy) to preserve original quality.
 */
export const exportProject = async (
  clips: EditorClip[],
  onProgress?: ProgressCallback,
  userId?: string,
  companyId?: string | null,
  projectName?: string
): Promise<Blob> => {
  console.log('[VideoEditor] Starting server-side export with', clips.length, 'clips');

  if (clips.length === 0) {
    throw new Error('No clips to export');
  }

  // Sort clips by timeline position
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  // Calculate total duration for progress estimates
  const totalDuration = sortedClips.reduce((sum, clip) => sum + getEffectiveDuration(clip), 0);
  console.log('[VideoEditor] Total duration:', totalDuration, 'seconds');

  onProgress?.(5, 'preparing', 'Preparing export request...');

  try {
    // Build request payload
    const request: ExportRequest = {
      clips: sortedClips.map(clip => ({
        id: clip.id,
        sourceUrl: clip.sourceUrl,
        sourceDuration: clip.sourceDuration,
        startTime: clip.startTime,
        trimStart: clip.trimStart,
        trimEnd: clip.trimEnd,
      })),
      userId: userId || 'anonymous',
      companyId: companyId || undefined,
      projectName: projectName || 'Exported Video',
    };

    console.log('[VideoEditor] Sending export request to:', MEDIA_PROCESSING_SERVICE_URL);
    onProgress?.(10, 'downloading-videos', 'Sending to processing server...');

    // Call the media processing service
    const response = await fetch(`${MEDIA_PROCESSING_SERVICE_URL}/video/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VideoEditor] Server error:', response.status, errorText);
      throw new Error(`Export service error: ${errorText}`);
    }

    onProgress?.(50, 'trimming', 'Processing video on server...');

    const result: ExportResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Export failed');
    }

    console.log('[VideoEditor] Export complete:', result);
    onProgress?.(80, 'concatenating', 'Downloading exported video...');

    // Download the exported video as a blob
    if (!result.videoUrl) {
      throw new Error('No video URL returned from export service');
    }

    const videoResponse = await fetch(result.videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download exported video');
    }

    const blob = await videoResponse.blob();
    console.log('[VideoEditor] Downloaded blob:', blob.size, 'bytes');

    onProgress?.(100, 'complete', 'Export complete!');

    return blob;
  } catch (error) {
    console.error('[VideoEditor] Export failed:', error);
    onProgress?.(0, 'error', error instanceof Error ? error.message : 'Export failed');
    throw error;
  }
};

/**
 * Export project and get the result metadata (without downloading the blob)
 * Useful when you just want the URL and don't need to download
 */
export const exportProjectToLibrary = async (
  clips: EditorClip[],
  userId: string,
  companyId: string | null,
  projectName: string,
  onProgress?: ProgressCallback
): Promise<{ url: string; mediaFileId: string; fileSize: number }> => {
  console.log('[VideoEditor] Starting server-side export to library');

  if (clips.length === 0) {
    throw new Error('No clips to export');
  }

  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  onProgress?.(5, 'preparing', 'Preparing export...');

  const request: ExportRequest = {
    clips: sortedClips.map(clip => ({
      id: clip.id,
      sourceUrl: clip.sourceUrl,
      sourceDuration: clip.sourceDuration,
      startTime: clip.startTime,
      trimStart: clip.trimStart,
      trimEnd: clip.trimEnd,
    })),
    userId,
    companyId: companyId || undefined,
    projectName,
  };

  onProgress?.(10, 'downloading-videos', 'Uploading to processing server...');

  const response = await fetch(`${MEDIA_PROCESSING_SERVICE_URL}/video/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Export service error: ${errorText}`);
  }

  onProgress?.(50, 'trimming', 'Processing video...');

  const result: ExportResponse = await response.json();

  if (!result.success || !result.videoUrl) {
    throw new Error(result.error || 'Export failed');
  }

  onProgress?.(100, 'complete', 'Export complete!');

  return {
    url: result.videoUrl,
    mediaFileId: result.mediaFileId || '',
    fileSize: result.fileSize || 0,
  };
};

/**
 * Get video duration from a URL
 * Uses HTML5 video element for metadata
 */
export const getVideoDuration = (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve(video.duration);
      video.src = '';
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = url;
  });
};

/**
 * Generate a thumbnail from a video at a specific time
 */
export const generateThumbnail = (
  videoUrl: string,
  time: number = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, video.duration);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailUrl);

      video.src = '';
    };

    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail'));
    };

    video.src = videoUrl;
  });
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Save export to library (wrapper for exportProjectToLibrary)
 * Kept for backwards compatibility with VideoEditor component
 */
export const saveExportToLibrary = async (
  blob: Blob,
  userId: string,
  companyId: string | null,
  projectName: string,
  duration: number,
  onProgress?: (message: string) => void
): Promise<{ url: string; mediaFileId: string } | null> => {
  // Note: With server-side export, the video is already saved to library
  // This function is kept for compatibility but the main export already handles this
  onProgress?.('Video already saved to library by export service');
  return null;
};
