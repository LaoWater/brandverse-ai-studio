// ============================================
// MEDIA STUDIO SERVICE - SIMPLIFIED VERSION
// Database integration pending backend implementation
// ============================================

export interface MediaFile {
  id: string;
  user_id: string;
  company_id: string | null;
  file_name: string;
  file_type: 'video' | 'image';
  file_format: string;
  file_size: number | null;
  storage_path: string;
  public_url: string;
  thumbnail_url: string | null;
  prompt: string;
  model_used: string;
  aspect_ratio: string | null;
  quality: string | null;
  duration: number | null;
  reference_image_url: string | null;
  tags: string[];
  is_favorite: boolean;
  custom_title: string | null;
  notes: string | null;
  download_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface MediaFilters {
  fileType?: 'video' | 'image' | 'all';
  isFavorite?: boolean;
  searchQuery?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  model?: string;
  sortBy?: 'created_at' | 'updated_at' | 'download_count' | 'view_count';
  sortOrder?: 'asc' | 'desc';
}

export interface StorageUsage {
  total_files: number;
  total_size_mb: number;
  video_count: number;
  image_count: number;
}

export interface GenerationConfig {
  prompt: string;
  mediaType: 'video' | 'image';
  model: string;               // API model identifier (e.g., 'gemini-2.5-flash-image', 'veo-3.1-generate-001')
  aspectRatio: string;         // '1:1', '16:9', '9:16', '3:4', '4:3', '3:2'

  // Image-specific
  numberOfImages?: number;     // 1-4 for Imagen, 1-10 for GPT-image
  imageSize?: '1K' | '2K' | '4K';  // For Imagen 4 and Gemini 3 Pro
  seed?: number;               // For reproducible generation (Imagen 4, GPT-image)
  negativePrompt?: string;     // For Imagen 4 AND Veo 3.1 video
  enhancePrompt?: boolean;     // For Imagen 4
  referenceImageUrls?: string[]; // Multiple reference images (up to 14 for Gemini 3 Pro, up to 3 for Veo 3.1)

  // Video-specific (Veo 3.1 official params)
  videoMode?: 'text-to-video' | 'image-to-video' | 'interpolation' | 'extend-video';
  videoDuration?: 4 | 6 | 8;   // 8s required for 1080p/4k, reference images, or extension
  videoResolution?: '720p' | '1080p' | '4k'; // 1080p/4k only with 8s duration; 720p ONLY for extension
  generateAudio?: boolean;     // Generate audio with video (default: true)
  personGeneration?: 'allow_all' | 'allow_adult'; // Controls people generation
  inputImageUrl?: string;      // For image-to-video mode
  firstFrameUrl?: string;      // For interpolation mode (start frame)
  lastFrameUrl?: string;       // For interpolation mode (end frame)
  sourceVideoGcsUri?: string;  // For extend-video mode (GCS URI of video to extend)

  // Common
  userId?: string;             // For tracking
  companyId?: string;          // For tracking
}

export interface GenerationResult {
  success: boolean;
  mediaUrl: string;
  thumbnailUrl?: string;
  metadata: {
    model: string;
    prompt: string;
    duration?: number;
    aspectRatio: string;
    numberOfImages?: number;
    imageSize?: string;
    seed?: number;
    referenceImageUrls?: string[];
  };
  error?: string;
}

// API Payload for backend - Image generation
export interface MediaGenerationAPIPayload {
  prompt: string;
  model: string;                    // 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview' | 'imagen-4.0-generate-001' | 'gpt-image-1.5'
  aspect_ratio: string;             // '1:1', '16:9', '9:16', '3:4', '4:3', '3:2'
  number_of_images?: number;        // 1-4 for Imagen, 1-10 for GPT-image (default: 1)
  image_size?: '1K' | '2K' | '4K';  // For Imagen 4 and Gemini 3 Pro (default: '1K')
  seed?: number;                    // For reproducible generation
  negative_prompt?: string;         // For Imagen 4
  enhance_prompt?: boolean;         // For Imagen 4 (default: true)
  reference_image_urls?: string[];  // Multiple reference images (up to 14 for Gemini 3 Pro)
  user_id?: string;
  company_id?: string;
}

// API Payload for backend - Video generation (Veo 3.1 official params)
export interface VideoGenerationAPIPayload {
  prompt: string;
  model: 'veo-3.1-generate-001' | 'veo-3.1-fast-generate-001';
  mode: 'text-to-video' | 'image-to-video' | 'interpolation' | 'extend-video';
  aspect_ratio: '16:9' | '9:16';    // Only 16:9 and 9:16 supported by Veo 3.1
  duration: 4 | 6 | 8;              // 8s required for 1080p/4k, reference images, or extension
  resolution?: '720p' | '1080p' | '4k'; // 1080p/4k only with 8s duration; 720p ONLY for extension
  negative_prompt?: string;         // Describes what NOT to include in the video
  generate_audio?: boolean;         // Generate audio with video (default: true)
  person_generation?: 'allow_all' | 'allow_adult'; // Controls people generation
  input_image_url?: string;         // For image-to-video mode (maps to API "image")
  // For interpolation mode - Official API: "image" (start) + "lastFrame" (end)
  first_frame_url?: string;         // Start image (maps to API "image" param)
  last_frame_url?: string;          // End image (maps to API "lastFrame" param)
  reference_image_urls?: string[];  // Up to 3 style/content reference images (Veo 3.1 exclusive)
  // For extend-video mode - Continue a previously generated Veo video
  source_video_gcs_uri?: string;    // GCS URI of Veo-generated video to extend (720p, 8s, <2 days old)
  user_id?: string;
  company_id?: string;
}

// Supabase imports
import { supabase } from '@/integrations/supabase/client';

// Supabase Edge Function URL - hardcoded since it's in the client config
const SUPABASE_FUNCTION_URL = 'https://vcgaqikuaaazjpwyzvwb.supabase.co/functions/v1';

/**
 * Prepare API payload for image generation
 * Converts frontend config to backend API format
 */
export const prepareMediaAPIPayload = (config: GenerationConfig): MediaGenerationAPIPayload => {
  const payload: MediaGenerationAPIPayload = {
    prompt: config.prompt,
    model: config.model,
    aspect_ratio: config.aspectRatio,
  };

  // Add optional parameters based on model
  if (config.numberOfImages !== undefined) {
    payload.number_of_images = config.numberOfImages;
  }

  if (config.imageSize) {
    payload.image_size = config.imageSize;
  }

  if (config.seed !== undefined) {
    payload.seed = config.seed;
  }

  if (config.negativePrompt) {
    payload.negative_prompt = config.negativePrompt;
  }

  if (config.enhancePrompt !== undefined) {
    payload.enhance_prompt = config.enhancePrompt;
  }

  if (config.referenceImageUrls && config.referenceImageUrls.length > 0) {
    payload.reference_image_urls = config.referenceImageUrls;
  }

  if (config.userId) {
    payload.user_id = config.userId;
  }

  if (config.companyId) {
    payload.company_id = config.companyId;
  }

  return payload;
};

/**
 * Prepare API payload for video generation (Veo 3.1)
 * Converts frontend config to backend API format
 * Official docs: https://ai.google.dev/gemini-api/docs/video
 */
export const prepareVideoAPIPayload = (config: GenerationConfig): VideoGenerationAPIPayload => {
  if (!config.videoMode) {
    throw new Error('Video mode is required for video generation');
  }

  // Validate aspect ratio for Veo 3.1 (only 16:9 and 9:16 supported)
  const aspectRatio = config.aspectRatio as '16:9' | '9:16';
  if (!['16:9', '9:16'].includes(aspectRatio)) {
    throw new Error('Veo 3.1 only supports aspect ratios: 16:9 or 9:16');
  }

  const payload: VideoGenerationAPIPayload = {
    prompt: config.prompt,
    model: config.model as 'veo-3.1-generate-001' | 'veo-3.1-fast-generate-001',
    mode: config.videoMode,
    aspect_ratio: aspectRatio,
    duration: config.videoDuration || 8, // Default to 8 seconds
  };

  // Resolution (720p default, 1080p/4k require 8s duration)
  if (config.videoResolution) {
    payload.resolution = config.videoResolution;
  }

  // Negative prompt - describes what NOT to include
  if (config.negativePrompt) {
    payload.negative_prompt = config.negativePrompt;
  }

  // Audio generation flag (defaults to true)
  payload.generate_audio = config.generateAudio ?? true;

  // Person generation control
  if (config.personGeneration) {
    payload.person_generation = config.personGeneration;
  }

  // Reference images for style/content guidance (Veo 3.1 exclusive, max 3)
  if (config.referenceImageUrls && config.referenceImageUrls.length > 0) {
    if (config.referenceImageUrls.length > 3) {
      throw new Error('Veo 3.1 supports a maximum of 3 reference images');
    }
    payload.reference_image_urls = config.referenceImageUrls;
  }

  // Mode-specific parameters
  if (config.videoMode === 'image-to-video' && config.inputImageUrl) {
    payload.input_image_url = config.inputImageUrl;
  }

  if (config.videoMode === 'interpolation') {
    if (config.firstFrameUrl) payload.first_frame_url = config.firstFrameUrl;
    if (config.lastFrameUrl) payload.last_frame_url = config.lastFrameUrl;
  }

  if (config.videoMode === 'extend-video') {
    // Video extension mode - requires GCS URI, 720p, and 8s duration
    if (!config.sourceVideoGcsUri) {
      throw new Error('Source video GCS URI is required for extend-video mode');
    }
    payload.source_video_gcs_uri = config.sourceVideoGcsUri;
    payload.resolution = '720p'; // Extension only supports 720p
    payload.duration = 8; // Extension requires 8s duration
  }

  // Tracking
  if (config.userId) {
    payload.user_id = config.userId;
  }

  if (config.companyId) {
    payload.company_id = config.companyId;
  }

  return payload;
};

/**
 * Generate media using Supabase Edge Function
 * Routes to image or video generation based on mediaType
 */
export const generateMedia = async (
  config: GenerationConfig,
  onProgress?: (progress: number, stage: string) => void
): Promise<GenerationResult> => {
  try {
    // Prepare API payload based on media type
    const payload = config.mediaType === 'video'
      ? prepareVideoAPIPayload(config)
      : prepareMediaAPIPayload(config);

    const endpointName = config.mediaType === 'video'
      ? 'generate-media-video'
      : 'generate-media-image';

    console.log(`=== MEDIA STUDIO ${config.mediaType.toUpperCase()} GENERATION PAYLOAD ===`);
    console.log(JSON.stringify(payload, null, 2));
    console.log("======================================================================");

    // Update progress - initialization
    onProgress?.(10, 'Initializing generation...');

    // Get auth session for edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }

    // Update progress - processing
    onProgress?.(30, 'Sending request to AI...');

    // Call Supabase Edge Function
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/${endpointName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    onProgress?.(50, `Generating with ${config.model}...`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Media generation failed." }));
      throw new Error(errorData?.error || `Server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      // Pass through the detailed error message from the backend
      throw new Error(result.error || "Generation failed. Please try again.");
    }

    onProgress?.(90, 'Finalizing and saving...');

    onProgress?.(100, 'Complete!');

    // Return result with appropriate media URL field
    const mediaUrl = config.mediaType === 'video' ? result.video_url : result.image_url;

    return {
      success: true,
      mediaUrl: mediaUrl,
      thumbnailUrl: result.thumbnail_url || mediaUrl,
      metadata: {
        model: config.model,
        prompt: config.prompt,
        aspectRatio: config.aspectRatio,
        numberOfImages: config.numberOfImages,
        imageSize: config.imageSize,
        seed: config.seed,
        referenceImageUrls: config.referenceImageUrls,
        duration: config.videoDuration,
      },
    };
  } catch (error: any) {
    console.error("Error during media generation:", error);
    return {
      success: false,
      mediaUrl: '',
      error: error.message || "An unexpected error occurred during media generation.",
      metadata: {
        model: config.model,
        prompt: config.prompt,
        aspectRatio: config.aspectRatio,
      },
    };
  }
};

/**
 * Get user's media library with optional filters
 */
export const getUserMediaLibrary = async (
  userId: string,
  companyId?: string | null,
  filters?: MediaFilters
): Promise<MediaFile[]> => {
  try {
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId);

    // Filter by company if specified
    // If companyId is explicitly null, fetch all companies for the user
    // If companyId is undefined or a string, filter by that company
    if (companyId !== null && companyId !== undefined) {
      query = query.eq('company_id', companyId);
    }

    // Filter by file type
    if (filters?.fileType && filters.fileType !== 'all') {
      query = query.eq('file_type', filters.fileType);
    }

    // Filter by favorite
    if (filters?.isFavorite !== undefined) {
      query = query.eq('is_favorite', filters.isFavorite);
    }

    // Search query (searches in prompt, custom_title, and notes)
    if (filters?.searchQuery) {
      query = query.or(
        `prompt.ilike.%${filters.searchQuery}%,custom_title.ilike.%${filters.searchQuery}%,notes.ilike.%${filters.searchQuery}%`
      );
    }

    // Filter by tags
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Date range filters
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Filter by model
    if (filters?.model) {
      query = query.eq('model_used', filters.model);
    }

    // Sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching media library:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserMediaLibrary:', error);
    return [];
  }
};

/**
 * Save a new media record to the database
 */
export const saveMediaRecord = async (
  mediaData: Omit<MediaFile, 'id' | 'created_at' | 'updated_at' | 'download_count' | 'view_count'>
): Promise<{ data: MediaFile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .insert([mediaData])
      .select()
      .single();

    if (error) {
      console.error('Error saving media record:', error);
      return { data: null, error };
    }

    console.log('Media record saved successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error in saveMediaRecord:', error);
    return { data: null, error };
  }
};

/**
 * Delete a media file from both storage and database
 */
export const deleteMediaFile = async (
  mediaId: string,
  storagePath: string,
  fileType: 'video' | 'image'
): Promise<{ success: boolean }> => {
  try {
    // Delete from storage bucket
    const bucketName = fileType === 'video' ? 'media-studio-videos' : 'media-studio-images';

    // Extract the path from the full storage_path if it contains bucket info
    const path = storagePath.includes('/') ? storagePath : storagePath;

    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteMediaFile:', error);
    return { success: false };
  }
};

/**
 * Toggle favorite status of a media file
 */
export const toggleFavorite = async (
  mediaId: string,
  isFavorite: boolean
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from('media_files')
      .update({ is_favorite: isFavorite })
      .eq('id', mediaId);

    if (error) {
      console.error('Error toggling favorite:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    return { success: false };
  }
};

/**
 * Update media file metadata
 */
export const updateMediaMetadata = async (
  mediaId: string,
  updates: Partial<MediaFile>
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('media_files')
      .update(updates)
      .eq('id', mediaId);

    if (error) {
      console.error('Error updating media metadata:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateMediaMetadata:', error);
    return { success: false, error };
  }
};

/**
 * Get user's storage usage statistics
 */
export const getUserStorageUsage = async (userId: string): Promise<StorageUsage | null> => {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('file_type, file_size')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching storage usage:', error);
      return null;
    }

    const usage: StorageUsage = {
      total_files: data.length,
      total_size_mb: data.reduce((sum, file) => sum + (file.file_size || 0), 0) / (1024 * 1024),
      video_count: data.filter(f => f.file_type === 'video').length,
      image_count: data.filter(f => f.file_type === 'image').length,
    };

    return usage;
  } catch (error) {
    console.error('Error in getUserStorageUsage:', error);
    return null;
  }
};

/**
 * Get trending tags from all media files
 */
export const getTrendingTags = async (userId?: string): Promise<{ tag: string; usage_count: number }[]> => {
  try {
    let query = supabase
      .from('media_files')
      .select('tags');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trending tags:', error);
      return [];
    }

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    data.forEach(file => {
      (file.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Convert to array and sort by usage
    return Object.entries(tagCounts)
      .map(([tag, usage_count]) => ({ tag, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 20); // Return top 20 tags
  } catch (error) {
    console.error('Error in getTrendingTags:', error);
    return [];
  }
};

/**
 * Increment download count for a media file
 */
export const incrementDownloadCount = async (mediaId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_media_download_count', {
      media_id: mediaId
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const { data: current } = await supabase
        .from('media_files')
        .select('download_count')
        .eq('id', mediaId)
        .single();

      if (current) {
        await supabase
          .from('media_files')
          .update({ download_count: (current.download_count || 0) + 1 })
          .eq('id', mediaId);
      }
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
};

/**
 * Increment view count for a media file
 */
export const incrementViewCount = async (mediaId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_media_view_count', {
      media_id: mediaId
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const { data: current } = await supabase
        .from('media_files')
        .select('view_count')
        .eq('id', mediaId)
        .single();

      if (current) {
        await supabase
          .from('media_files')
          .update({ view_count: (current.view_count || 0) + 1 })
          .eq('id', mediaId);
      }
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

/**
 * Upload a reference image to storage
 */
export const uploadReferenceImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_reference.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('media-studio-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading reference image:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-studio-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadReferenceImage:', error);
    return null;
  }
};

/**
 * Upload a video frame image to storage (for video generation)
 */
export const uploadVideoFrameImage = async (
  file: File,
  userId: string,
  frameType: 'first' | 'last' | 'input'
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${frameType}_frame.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('media-studio-images') // Use same bucket as reference images
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`Error uploading ${frameType} frame:`, error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-studio-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error(`Error in uploadVideoFrameImage (${frameType}):`, error);
    return null;
  }
};

export const generateMediaWithProgress = async (
  config: GenerationConfig,
  onProgress?: (progress: number, stage: string) => void
): Promise<GenerationResult> => {
  return generateMedia(config, onProgress);
};

/**
 * Extract the last frame from a video as a Blob
 * Uses HTML5 Canvas API to capture the frame
 */
export const extractLastFrameFromVideo = (
  videoUrl: string,
  onProgress?: (stage: string) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    onProgress?.('Loading video...');

    // Create video element
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // Required for CORS
    video.muted = true; // Mute to allow autoplay policies
    video.playsInline = true;

    // Create canvas for frame extraction
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    let hasExtracted = false;

    const extractFrame = () => {
      if (hasExtracted) return;
      hasExtracted = true;

      onProgress?.('Extracting frame...');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          // Cleanup
          video.pause();
          video.src = '';
          video.load();

          if (blob) {
            onProgress?.('Frame extracted!');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        1.0 // Maximum quality
      );
    };

    // Handle video metadata loaded
    video.onloadedmetadata = () => {
      onProgress?.('Seeking to last frame...');
      // Seek to near the end (0.1 seconds before end to ensure we get a frame)
      const seekTime = Math.max(0, video.duration - 0.1);
      video.currentTime = seekTime;
    };

    // Handle seek complete
    video.onseeked = () => {
      // Small delay to ensure frame is rendered
      setTimeout(extractFrame, 100);
    };

    // Handle errors
    video.onerror = () => {
      const errorMessage = video.error?.message || 'Unknown video error';
      reject(new Error(`Failed to load video: ${errorMessage}`));
    };

    // Start loading the video
    video.src = videoUrl;
    video.load();
  });
};

/**
 * Upload an extracted video frame to Supabase storage
 * Returns the public URL of the uploaded image
 */
export const uploadExtractedFrame = async (
  frameBlob: Blob,
  userId: string,
  sourceVideoId?: string
): Promise<string | null> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}_extracted_frame${sourceVideoId ? `_from_${sourceVideoId.slice(0, 8)}` : ''}.png`;

    const { data, error } = await supabase.storage
      .from('media-studio-images')
      .upload(fileName, frameBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png'
      });

    if (error) {
      console.error('Error uploading extracted frame:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-studio-images')
      .getPublicUrl(data.path);

    console.log('Extracted frame uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadExtractedFrame:', error);
    return null;
  }
};

/**
 * Extract last frame from video and upload to storage
 * Combined utility for video continuation feature
 */
export const extractAndUploadLastFrame = async (
  videoUrl: string,
  userId: string,
  sourceVideoId?: string,
  onProgress?: (stage: string) => void
): Promise<{ success: boolean; frameUrl?: string; error?: string }> => {
  try {
    onProgress?.('Extracting last frame from video...');

    // Extract the frame
    const frameBlob = await extractLastFrameFromVideo(videoUrl, onProgress);

    onProgress?.('Uploading frame to storage...');

    // Upload to Supabase
    const frameUrl = await uploadExtractedFrame(frameBlob, userId, sourceVideoId);

    if (!frameUrl) {
      return { success: false, error: 'Failed to upload extracted frame' };
    }

    onProgress?.('Frame ready!');
    return { success: true, frameUrl };
  } catch (error: any) {
    console.error('Error in extractAndUploadLastFrame:', error);
    return { success: false, error: error.message || 'Failed to extract frame from video' };
  }
};
