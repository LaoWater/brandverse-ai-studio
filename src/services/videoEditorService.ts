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
 * Helper to fetch with timeout
 */
const fetchWithTimeout = async (url: string, timeout: number = 30000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Lazy load FFmpeg WASM
 * Uses single-threaded version (no SharedArrayBuffer required)
 */
export const loadFFmpeg = async (
  onProgress?: (message: string) => void
): Promise<FFmpeg> => {
  console.log('[VideoEditor] loadFFmpeg called, loaded:', ffmpegLoaded, 'loading:', ffmpegLoading);

  if (ffmpegLoaded && ffmpeg) {
    console.log('[VideoEditor] Returning cached FFmpeg instance');
    return ffmpeg;
  }

  if (ffmpegLoading) {
    console.log('[VideoEditor] Waiting for existing FFmpeg load...');
    const startTime = Date.now();
    while (ffmpegLoading && Date.now() - startTime < 60000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpegLoaded && ffmpeg) {
      return ffmpeg;
    }
    if (ffmpegLoading) {
      ffmpegLoading = false;
      throw new Error('FFmpeg loading timed out');
    }
  }

  ffmpegLoading = true;
  onProgress?.('Initializing video processor...');

  try {
    console.log('[VideoEditor] Creating new FFmpeg instance');
    ffmpeg = new FFmpeg();

    // Set up logging
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    // Set up progress
    ffmpeg.on('progress', ({ progress, time }) => {
      console.log('[FFmpeg Progress]', Math.round(progress * 100) + '%', 'time:', time);
    });

    // Use the single-threaded (st) version - doesn't require SharedArrayBuffer
    // This works without COOP/COEP headers
    const baseURL = 'https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/umd';

    onProgress?.('Downloading video processor...');
    console.log('[VideoEditor] Fetching FFmpeg single-threaded core from:', baseURL);

    // Fetch core JS with timeout
    console.log('[VideoEditor] Fetching core.js...');
    const coreResponse = await fetchWithTimeout(`${baseURL}/ffmpeg-core.js`, 30000);
    if (!coreResponse.ok) throw new Error(`Failed to fetch ffmpeg-core.js: ${coreResponse.status}`);
    const coreBlob = await coreResponse.blob();
    const coreURL = URL.createObjectURL(coreBlob);
    console.log('[VideoEditor] Core JS loaded, size:', coreBlob.size);

    // Fetch WASM with timeout
    onProgress?.('Downloading video processor (50%)...');
    console.log('[VideoEditor] Fetching core.wasm...');
    const wasmResponse = await fetchWithTimeout(`${baseURL}/ffmpeg-core.wasm`, 60000);
    if (!wasmResponse.ok) throw new Error(`Failed to fetch ffmpeg-core.wasm: ${wasmResponse.status}`);
    const wasmBlob = await wasmResponse.blob();
    const wasmURL = URL.createObjectURL(wasmBlob);
    console.log('[VideoEditor] WASM loaded, size:', wasmBlob.size);

    onProgress?.('Starting video processor...');
    console.log('[VideoEditor] Loading FFmpeg (single-threaded mode)...');

    // Add timeout to ffmpeg.load() - it can hang indefinitely
    const loadPromise = ffmpeg.load({
      coreURL,
      wasmURL,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('FFmpeg initialization timed out after 45 seconds')), 45000);
    });

    await Promise.race([loadPromise, timeoutPromise]);

    ffmpegLoaded = true;
    console.log('[VideoEditor] FFmpeg loaded successfully!');
    onProgress?.('Video processor ready!');

    return ffmpeg;
  } catch (error) {
    console.error('[VideoEditor] Failed to load FFmpeg:', error);
    ffmpegLoading = false;
    ffmpeg = null;

    // Provide helpful error message
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (errorMsg.includes('abort') || errorMsg.includes('timeout')) {
      throw new Error('Video processor download timed out. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to load video processor: ${errorMsg}`);
  } finally {
    ffmpegLoading = false;
  }
};

/**
 * Download a video file and write it to FFmpeg's virtual filesystem
 * Handles CORS by using fetch with no-cors mode and reading as blob
 */
const downloadAndWriteVideo = async (
  ffmpeg: FFmpeg,
  url: string,
  filename: string,
  onProgress?: (message: string) => void
): Promise<void> => {
  onProgress?.(`Downloading ${filename}...`);
  console.log(`[VideoEditor] Downloading video: ${url} -> ${filename}`);

  try {
    let videoData: Uint8Array;

    // Use fetchFile from @ffmpeg/util - it handles CORS properly
    console.log('[VideoEditor] Fetching with fetchFile...');
    videoData = await fetchFile(url);
    console.log(`[VideoEditor] fetchFile successful, size: ${videoData.length} bytes`);

    if (videoData.length === 0) {
      throw new Error('Downloaded file is empty');
    }

    console.log(`[VideoEditor] Writing file to FFmpeg filesystem: ${filename}`);
    await ffmpeg.writeFile(filename, videoData);
    console.log(`[VideoEditor] File written successfully: ${filename}`);
  } catch (error) {
    console.error(`[VideoEditor] Failed to download video from ${url}:`, error);
    throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Network error - check if video URL is accessible'}`);
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
  console.log('[VideoEditor] Starting export with', clips.length, 'clips');

  if (clips.length === 0) {
    throw new Error('No clips to export');
  }

  try {
    // Step 1: Load FFmpeg
    console.log('[VideoEditor] Step 1: Loading FFmpeg...');
    onProgress?.(2, 'loading-ffmpeg', 'Loading video processor...');

    const ffmpegInstance = await loadFFmpeg((msg) => {
      console.log('[VideoEditor] FFmpeg load progress:', msg);
      onProgress?.(5, 'loading-ffmpeg', msg);
    });

    console.log('[VideoEditor] FFmpeg loaded successfully');

    // Sort clips by timeline position
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
    console.log('[VideoEditor] Processing', sortedClips.length, 'clips in order');

    // Step 2: Download all videos
    console.log('[VideoEditor] Step 2: Downloading videos...');
    onProgress?.(10, 'downloading-videos', 'Downloading video files...');

    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const inputFile = `input_${i}.mp4`;
      const progress = 10 + ((i + 1) / sortedClips.length) * 20;

      console.log(`[VideoEditor] Downloading clip ${i + 1}/${sortedClips.length}: ${clip.sourceUrl}`);

      await downloadAndWriteVideo(
        ffmpegInstance,
        clip.sourceUrl,
        inputFile,
        (msg) => onProgress?.(progress, 'downloading-videos', msg)
      );

      onProgress?.(progress, 'downloading-videos', `Downloaded ${i + 1} of ${sortedClips.length}`);
    }

    console.log('[VideoEditor] All videos downloaded');

    // Step 3: Trim each video
    console.log('[VideoEditor] Step 3: Trimming videos...');
    const trimmedFiles: string[] = [];

    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const inputFile = `input_${i}.mp4`;
      const outputFile = `trimmed_${i}.mp4`;
      const effectiveDuration = getEffectiveDuration(clip);
      const progress = 30 + ((i + 1) / sortedClips.length) * 40;

      console.log(`[VideoEditor] Processing clip ${i + 1}/${sortedClips.length}:`, {
        trimStart: clip.trimStart,
        trimEnd: clip.trimEnd,
        effectiveDuration,
      });

      onProgress?.(progress, 'trimming', `Processing clip ${i + 1} of ${sortedClips.length}...`);

      // Only trim if there's actual trimming to do
      if (clip.trimStart > 0 || clip.trimEnd > 0) {
        console.log(`[VideoEditor] Trimming clip ${i + 1}: start=${clip.trimStart}, duration=${effectiveDuration}`);
        await trimVideo(
          ffmpegInstance,
          inputFile,
          outputFile,
          clip.trimStart,
          effectiveDuration
        );
        trimmedFiles.push(outputFile);
        console.log(`[VideoEditor] Clip ${i + 1} trimmed successfully`);
      } else {
        // No trimming needed, use input directly
        console.log(`[VideoEditor] Clip ${i + 1} - no trim needed, using input directly`);
        trimmedFiles.push(inputFile);
      }
    }

    console.log('[VideoEditor] All clips processed, trimmed files:', trimmedFiles);

    // Step 4: Concatenate all trimmed videos
    console.log('[VideoEditor] Step 4: Concatenating videos...');
    onProgress?.(70, 'concatenating', 'Joining clips together...');
    const outputFile = 'output.mp4';

    if (trimmedFiles.length === 1) {
      // Single clip, just copy it
      console.log('[VideoEditor] Single clip, copying directly');
      const data = await ffmpegInstance.readFile(trimmedFiles[0]);
      await ffmpegInstance.writeFile(outputFile, data);
    } else {
      console.log('[VideoEditor] Multiple clips, concatenating...');
      await concatenateVideos(ffmpegInstance, trimmedFiles, outputFile);
    }

    console.log('[VideoEditor] Concatenation complete');

    // Step 5: Read the output file
    console.log('[VideoEditor] Step 5: Reading output file...');
    onProgress?.(90, 'finalizing', 'Preparing download...');
    const outputData = await ffmpegInstance.readFile(outputFile);
    console.log('[VideoEditor] Output file size:', outputData.length, 'bytes');

    // Cleanup virtual filesystem
    console.log('[VideoEditor] Cleaning up temporary files...');
    for (let i = 0; i < sortedClips.length; i++) {
      try {
        await ffmpegInstance.deleteFile(`input_${i}.mp4`);
        if (sortedClips[i].trimStart > 0 || sortedClips[i].trimEnd > 0) {
          await ffmpegInstance.deleteFile(`trimmed_${i}.mp4`);
        }
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
    console.log('[VideoEditor] Export complete!');

    // Create blob from output
    return new Blob([outputData], { type: 'video/mp4' });
  } catch (error) {
    console.error('[VideoEditor] Export failed:', error);
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

/**
 * Upload exported video to Supabase storage and save to media library
 */
export const saveExportToLibrary = async (
  blob: Blob,
  userId: string,
  companyId: string | null,
  projectName: string,
  duration: number,
  onProgress?: (message: string) => void
): Promise<{ url: string; mediaFileId: string } | null> => {
  const { supabase } = await import('@/integrations/supabase/client');

  try {
    onProgress?.('Preparing upload...');
    console.log('[VideoEditor] Saving export to library...');

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `edited_${timestamp}.mp4`;
    const storagePath = `${userId}/videos/${filename}`;

    onProgress?.('Uploading to cloud storage...');
    console.log('[VideoEditor] Uploading to:', storagePath);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-files')
      .upload(storagePath, blob, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      console.error('[VideoEditor] Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('[VideoEditor] Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media-files')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log('[VideoEditor] Public URL:', publicUrl);

    onProgress?.('Saving to library...');

    // Create media library entry
    const { data: mediaFile, error: mediaError } = await supabase
      .from('media_files')
      .insert({
        user_id: userId,
        company_id: companyId,
        file_name: `${projectName}.mp4`,
        file_type: 'video',
        file_size: blob.size,
        storage_path: storagePath,
        public_url: publicUrl,
        duration: duration,
        prompt: `Edited video: ${projectName}`,
        status: 'completed',
        source: 'editor',
      })
      .select()
      .single();

    if (mediaError) {
      console.error('[VideoEditor] Media file insert error:', mediaError);
      // Don't throw - video is uploaded, just library entry failed
      return { url: publicUrl, mediaFileId: '' };
    }

    console.log('[VideoEditor] Media file created:', mediaFile);
    onProgress?.('Saved to library!');

    return { url: publicUrl, mediaFileId: mediaFile.id };
  } catch (error) {
    console.error('[VideoEditor] Save to library failed:', error);
    throw error;
  }
};
