import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES & INTERFACES
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

export interface MediaUploadData {
  userId: string;
  companyId: string | null;
  file: File;
  prompt: string;
  modelUsed: string;
  aspectRatio: string;
  quality: string;
  duration?: number;
  referenceImageUrl?: string;
  fileType: 'video' | 'image';
}

export interface StorageUsage {
  total_files: number;
  total_size_mb: number;
  video_count: number;
  image_count: number;
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Upload a media file to Supabase Storage
 */
export const uploadMediaToStorage = async (
  file: File,
  userId: string,
  fileType: 'video' | 'image'
): Promise<{ url: string; path: string } | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `${userId}/${timestamp}_${randomId}.${fileExt}`;

    const bucketName = fileType === 'video' ? 'media-studio-videos' : 'media-studio-images';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading media:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Error in uploadMediaToStorage:', error);
    return null;
  }
};

/**
 * Upload a reference image to Supabase Storage
 */
export const uploadReferenceImage = async (
  file: File,
  userId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('media-studio-references')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading reference image:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('media-studio-references')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadReferenceImage:', error);
    return null;
  }
};

/**
 * Delete a media file from Supabase Storage
 */
export const deleteMediaFromStorage = async (
  storagePath: string,
  fileType: 'video' | 'image'
): Promise<boolean> => {
  try {
    const bucketName = fileType === 'video' ? 'media-studio-videos' : 'media-studio-images';

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    if (error) {
      console.error('Error deleting media from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteMediaFromStorage:', error);
    return false;
  }
};

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Save media metadata to database
 */
export const saveMediaRecord = async (
  mediaData: Omit<MediaFile, 'id' | 'created_at' | 'updated_at' | 'download_count' | 'view_count'>
): Promise<{ data: MediaFile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .insert({
        user_id: mediaData.user_id,
        company_id: mediaData.company_id,
        file_name: mediaData.file_name,
        file_type: mediaData.file_type,
        file_format: mediaData.file_format,
        file_size: mediaData.file_size,
        storage_path: mediaData.storage_path,
        public_url: mediaData.public_url,
        thumbnail_url: mediaData.thumbnail_url,
        prompt: mediaData.prompt,
        model_used: mediaData.model_used,
        aspect_ratio: mediaData.aspect_ratio,
        quality: mediaData.quality,
        duration: mediaData.duration,
        reference_image_url: mediaData.reference_image_url,
        tags: mediaData.tags,
        is_favorite: mediaData.is_favorite,
        custom_title: mediaData.custom_title,
        notes: mediaData.notes,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error saving media record:', error);
    return { data: null, error };
  }
};

/**
 * Get all media files for a user with optional filters
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

    // Company filter
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    // File type filter
    if (filters?.fileType && filters.fileType !== 'all') {
      query = query.eq('file_type', filters.fileType);
    }

    // Favorite filter
    if (filters?.isFavorite !== undefined) {
      query = query.eq('is_favorite', filters.isFavorite);
    }

    // Search query (searches prompt and custom_title)
    if (filters?.searchQuery) {
      query = query.or(
        `prompt.ilike.%${filters.searchQuery}%,custom_title.ilike.%${filters.searchQuery}%`
      );
    }

    // Tags filter
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Date range filter
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Model filter
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
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserMediaLibrary:', error);
    return [];
  }
};

/**
 * Get a single media file by ID
 */
export const getMediaById = async (mediaId: string): Promise<MediaFile | null> => {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (error) {
      console.error('Error fetching media:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getMediaById:', error);
    return null;
  }
};

/**
 * Update media metadata
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
      console.error('Error updating media:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateMediaMetadata:', error);
    return { success: false, error };
  }
};

/**
 * Toggle favorite status
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
 * Increment view count
 */
export const incrementViewCount = async (mediaId: string): Promise<void> => {
  try {
    await supabase.rpc('increment', {
      table_name: 'media_files',
      row_id: mediaId,
      column_name: 'view_count',
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

/**
 * Increment download count
 */
export const incrementDownloadCount = async (mediaId: string): Promise<void> => {
  try {
    const { data: currentData } = await supabase
      .from('media_files')
      .select('download_count')
      .eq('id', mediaId)
      .single();

    if (currentData) {
      await supabase
        .from('media_files')
        .update({ download_count: (currentData.download_count || 0) + 1 })
        .eq('id', mediaId);
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
};

/**
 * Delete a media file (both from database and storage)
 */
export const deleteMediaFile = async (
  mediaId: string,
  storagePath: string,
  fileType: 'video' | 'image'
): Promise<{ success: boolean }> => {
  try {
    // Delete from storage first
    const storageDeleted = await deleteMediaFromStorage(storagePath, fileType);

    if (!storageDeleted) {
      console.warn('Failed to delete from storage, but continuing with database deletion');
    }

    // Delete from database
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaId);

    if (error) {
      console.error('Error deleting media record:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteMediaFile:', error);
    return { success: false };
  }
};

/**
 * Get user's storage usage statistics
 */
export const getUserStorageUsage = async (userId: string): Promise<StorageUsage | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_media_storage_usage', { p_user_id: userId });

    if (error) {
      console.error('Error getting storage usage:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getUserStorageUsage:', error);
    return null;
  }
};

/**
 * Get trending tags for a user
 */
export const getTrendingTags = async (
  userId: string,
  limit: number = 10
): Promise<{ tag: string; usage_count: number }[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_trending_media_tags', { p_user_id: userId, p_limit: limit });

    if (error) {
      console.error('Error getting trending tags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTrendingTags:', error);
    return [];
  }
};

// ============================================
// DUMMY API FOR MEDIA GENERATION (Phase 2)
// Replace with real API calls in production
// ============================================

export interface GenerationConfig {
  prompt: string;
  mediaType: 'video' | 'image';
  model: string;
  aspectRatio: string;
  quality: string;
  duration?: number;
  referenceImageUrl?: string;
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
    quality: string;
  };
}

/**
 * Dummy media generation (simulates API call)
 */
export const generateMedia = async (
  config: GenerationConfig
): Promise<GenerationResult> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Return dummy result with placeholder URLs
  const isVideo = config.mediaType === 'video';

  return {
    success: true,
    mediaUrl: isVideo
      ? 'https://placehold.co/1920x1080/5B5FEE/FFFFFF/mp4?text=Generated+Video'
      : `https://placehold.co/1920x1080/5B5FEE/FFFFFF?text=${encodeURIComponent(config.prompt.slice(0, 30))}`,
    thumbnailUrl: isVideo
      ? 'https://placehold.co/640x360/5B5FEE/FFFFFF?text=Thumbnail'
      : undefined,
    metadata: {
      model: config.model,
      prompt: config.prompt,
      duration: config.duration,
      aspectRatio: config.aspectRatio,
      quality: config.quality,
    },
  };
};

/**
 * Generate media with progress tracking
 */
export const generateMediaWithProgress = async (
  config: GenerationConfig,
  onProgress: (stage: string, progress: number) => void
): Promise<GenerationResult> => {
  const stages = [
    { id: 'initializing', label: 'Initializing AI...', duration: 500 },
    { id: 'analyzing', label: 'Analyzing prompt...', duration: 800 },
    { id: 'generating', label: `Creating ${config.mediaType}...`, duration: 1500 },
    { id: 'processing', label: 'Processing output...', duration: 800 },
    { id: 'finalizing', label: 'Finalizing...', duration: 400 },
  ];

  let totalProgress = 0;
  const progressPerStage = 100 / stages.length;

  for (const stage of stages) {
    onProgress(stage.label, totalProgress);
    await new Promise((resolve) => setTimeout(resolve, stage.duration));
    totalProgress += progressPerStage;
  }

  onProgress('Complete!', 100);

  return generateMedia(config);
};
