// ============================================
// VIDEO EDITOR SERVICE
// Handles FFmpeg operations for video editing
// ============================================

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { EditorClip, ExportStage } from '@/types/editor';
import { getEffectiveDuration } from '@/types/editor';

// Singleton FFmpeg instance
let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;
let ffmpegLoading = false;

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number, stage: ExportStage, message?: string) => void;

/**
 * Check if SharedArrayBuffer is available (required for multi-threaded FFmpeg)
 */
export const isSharedArrayBufferAvailable = (): boolean => {
  try {
    return typeof SharedArrayBuffer !== 'undefined';
  } catch {
    return false;
  }
};

/**
 * Lazy load FFmpeg WASM
 * Uses single-threaded version if SharedArrayBuffer is not available
 */
export const loadFFmpeg = async (
  onProgress?: (message: string) => void
): Promise<FFmpeg> => {
  if (ffmpegLoaded && ffmpeg) {
    return ffmpeg;
  }

  if (ffmpegLoading) {
    // Wait for existing load to complete
    while (ffmpegLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpegLoaded && ffmpeg) {
      return ffmpeg;
    }
  }

  ffmpegLoading = true;
  onProgress?.('Initializing video processor...');

  try {
    ffmpeg = new FFmpeg();

    // Set up logging
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    // Load FFmpeg - using CDN for core files
    // Using single-threaded version for broader compatibility
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    onProgress?.('Loading video processing engine...');

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegLoaded = true;
    onProgress?.('Video processor ready!');

    return ffmpeg;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    ffmpegLoading = false;
    throw new Error('Failed to load video processing engine. Please try again.');
  } finally {
    ffmpegLoading = false;
  }
};

/**
 * Download a video file and write it to FFmpeg's virtual filesystem
 */
const downloadAndWriteVideo = async (
  ffmpeg: FFmpeg,
  url: string,
  filename: string,
  onProgress?: (message: string) => void
): Promise<void> => {
  onProgress?.(`Downloading ${filename}...`);

  try {
    const videoData = await fetchFile(url);
    await ffmpeg.writeFile(filename, videoData);
  } catch (error) {
    console.error(`Failed to download video from ${url}:`, error);
    throw new Error(`Failed to download video: ${filename}`);
  }
};

/**
 * Trim a single video clip
 */
export const trimVideo = async (
  ffmpeg: FFmpeg,
  inputFile: string,
  outputFile: string,
  startTime: number,
  duration: number,
  onProgress?: (message: string) => void
): Promise<void> => {
  onProgress?.(`Trimming video...`);

  // Use stream copy for faster processing when possible
  // -ss before -i for input seeking (faster but less accurate)
  // -t for duration
  // -c copy to avoid re-encoding (fast, preserves quality)
  await ffmpeg.exec([
    '-ss', startTime.toString(),
    '-i', inputFile,
    '-t', duration.toString(),
    '-c', 'copy',
    '-avoid_negative_ts', 'make_zero',
    outputFile,
  ]);
};

/**
 * Concatenate multiple video files
 * Requires videos to have same codec, resolution, etc.
 */
export const concatenateVideos = async (
  ffmpeg: FFmpeg,
  inputFiles: string[],
  outputFile: string,
  onProgress?: (message: string) => void
): Promise<void> => {
  if (inputFiles.length === 0) {
    throw new Error('No input files provided');
  }

  if (inputFiles.length === 1) {
    // Just copy the single file
    const data = await ffmpeg.readFile(inputFiles[0]);
    await ffmpeg.writeFile(outputFile, data);
    return;
  }

  onProgress?.('Joining video clips...');

  // Create concat demuxer file
  const concatList = inputFiles.map(f => `file '${f}'`).join('\n');
  await ffmpeg.writeFile('concat_list.txt', concatList);

  // Use concat demuxer (fastest method for same-codec files)
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat_list.txt',
    '-c', 'copy',
    outputFile,
  ]);

  // Cleanup concat list
  await ffmpeg.deleteFile('concat_list.txt');
};

/**
 * Re-encode videos to ensure compatibility for concatenation
 * Used when videos have different codecs/resolutions
 */
export const normalizeVideo = async (
  ffmpeg: FFmpeg,
  inputFile: string,
  outputFile: string,
  onProgress?: (message: string) => void
): Promise<void> => {
  onProgress?.('Normalizing video format...');

  // Re-encode to consistent format
  await ffmpeg.exec([
    '-i', inputFile,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outputFile,
  ]);
};

/**
 * Export a complete project with multiple clips
 */
export const exportProject = async (
  clips: EditorClip[],
  onProgress?: ProgressCallback
): Promise<Blob> => {
  if (clips.length === 0) {
    throw new Error('No clips to export');
  }

  const totalSteps = clips.length + 3; // download + trim each + concat + finalize
  let currentStep = 0;

  const updateProgress = (stage: ExportStage, message?: string) => {
    currentStep++;
    const progress = Math.round((currentStep / totalSteps) * 100);
    onProgress?.(progress, stage, message);
  };

  try {
    // Step 1: Load FFmpeg
    onProgress?.(0, 'loading-ffmpeg', 'Loading video processor...');
    const ffmpegInstance = await loadFFmpeg((msg) => {
      onProgress?.(5, 'loading-ffmpeg', msg);
    });

    // Sort clips by timeline position
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

    // Step 2: Download all videos
    onProgress?.(10, 'downloading-videos', 'Downloading video files...');
    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const inputFile = `input_${i}.mp4`;
      await downloadAndWriteVideo(
        ffmpegInstance,
        clip.sourceUrl,
        inputFile,
        (msg) => onProgress?.(10 + (i / sortedClips.length) * 20, 'downloading-videos', msg)
      );
    }

    // Step 3: Trim each video
    const trimmedFiles: string[] = [];
    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const inputFile = `input_${i}.mp4`;
      const outputFile = `trimmed_${i}.mp4`;
      const effectiveDuration = getEffectiveDuration(clip);

      onProgress?.(
        30 + (i / sortedClips.length) * 40,
        'trimming',
        `Processing clip ${i + 1} of ${sortedClips.length}...`
      );

      // Only trim if there's actual trimming to do
      if (clip.trimStart > 0 || clip.trimEnd > 0) {
        await trimVideo(
          ffmpegInstance,
          inputFile,
          outputFile,
          clip.trimStart,
          effectiveDuration
        );
        trimmedFiles.push(outputFile);
      } else {
        // No trimming needed, use input directly
        trimmedFiles.push(inputFile);
      }

      updateProgress('trimming', `Clip ${i + 1} processed`);
    }

    // Step 4: Concatenate all trimmed videos
    onProgress?.(70, 'concatenating', 'Joining clips together...');
    const outputFile = 'output.mp4';

    if (trimmedFiles.length === 1) {
      // Single clip, just read it
      const data = await ffmpegInstance.readFile(trimmedFiles[0]);
      await ffmpegInstance.writeFile(outputFile, data);
    } else {
      await concatenateVideos(ffmpegInstance, trimmedFiles, outputFile);
    }

    // Step 5: Read the output file
    onProgress?.(90, 'finalizing', 'Preparing download...');
    const outputData = await ffmpegInstance.readFile(outputFile);

    // Cleanup virtual filesystem
    for (let i = 0; i < sortedClips.length; i++) {
      try {
        await ffmpegInstance.deleteFile(`input_${i}.mp4`);
        await ffmpegInstance.deleteFile(`trimmed_${i}.mp4`);
      } catch {
        // Ignore cleanup errors
      }
    }
    try {
      await ffmpegInstance.deleteFile(outputFile);
    } catch {
      // Ignore cleanup errors
    }

    onProgress?.(100, 'complete', 'Export complete!');

    // Create blob from output
    return new Blob([outputData], { type: 'video/mp4' });
  } catch (error) {
    console.error('Export failed:', error);
    onProgress?.(0, 'error', error instanceof Error ? error.message : 'Export failed');
    throw error;
  }
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
