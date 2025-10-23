-- Media Studio Database Schema
-- This schema supports the Media Studio feature for storing user-generated media
-- Execute this in your Supabase SQL Editor

-- ============================================
-- TABLE: media_files
-- Stores metadata for all generated media (videos and images)
-- ============================================

CREATE TABLE IF NOT EXISTS media_files (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User and company associations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('video', 'image')),
  file_format TEXT NOT NULL, -- 'mp4', 'mov', 'png', 'jpg', 'webp'
  file_size BIGINT, -- in bytes

  -- Storage paths (Supabase Storage)
  storage_path TEXT NOT NULL, -- path in Supabase Storage bucket
  public_url TEXT NOT NULL, -- public URL to access the file
  thumbnail_url TEXT, -- thumbnail for videos or preview for images

  -- Generation metadata
  prompt TEXT NOT NULL, -- the prompt used to generate this media
  model_used TEXT NOT NULL, -- 'veo-3.1', 'sora-2', 'imagen-4'
  aspect_ratio TEXT, -- '1:1', '16:9', '9:16', etc.
  quality TEXT, -- 'standard', 'high', 'ultra'
  duration INTEGER, -- for videos only (in seconds)

  -- Reference data
  reference_image_url TEXT, -- if user provided a reference image

  -- User organization and discovery
  tags TEXT[] DEFAULT '{}', -- user-defined tags for categorization
  is_favorite BOOLEAN DEFAULT false, -- star/favorite status
  custom_title TEXT, -- optional user-given title (defaults to prompt excerpt)
  notes TEXT, -- user notes about this media

  -- Usage tracking
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for optimal query performance
-- ============================================

-- Primary user queries
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_company_id ON media_files(company_id);

-- Filtering and sorting
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_is_favorite ON media_files(is_favorite);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);

-- Text search on prompts and titles
CREATE INDEX idx_media_files_prompt_text ON media_files USING gin(to_tsvector('english', prompt));
CREATE INDEX idx_media_files_custom_title_text ON media_files USING gin(to_tsvector('english', custom_title));

-- Tag-based queries
CREATE INDEX idx_media_files_tags ON media_files USING gin(tags);

-- Composite index for common query patterns
CREATE INDEX idx_media_files_user_type_created ON media_files(user_id, file_type, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Ensure users can only access their own media
-- ============================================

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own media files
CREATE POLICY "Users can view their own media files"
  ON media_files
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own media files
CREATE POLICY "Users can insert their own media files"
  ON media_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own media files
CREATE POLICY "Users can update their own media files"
  ON media_files
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own media files
CREATE POLICY "Users can delete their own media files"
  ON media_files
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_media_files_updated_at();

-- ============================================
-- STORAGE BUCKETS (run these in Supabase Storage)
-- ============================================

-- Note: Execute these via Supabase Dashboard > Storage
-- or use the Supabase JavaScript client

-- Bucket: media-studio-videos
-- Purpose: Store generated video files
-- Public: true (for easy access)
-- File size limit: 100MB
-- Allowed MIME types: video/mp4, video/quicktime

-- Bucket: media-studio-images
-- Purpose: Store generated image files
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/png, image/jpeg, image/webp

-- Bucket: media-studio-references
-- Purpose: Store user-uploaded reference images
-- Public: false (private to user)
-- File size limit: 10MB
-- Allowed MIME types: image/png, image/jpeg, image/webp

-- Bucket: media-studio-thumbnails
-- Purpose: Store auto-generated thumbnails for videos
-- Public: true
-- File size limit: 2MB
-- Allowed MIME types: image/jpeg, image/webp

-- ============================================
-- STORAGE POLICIES (RLS for Storage)
-- ============================================

-- Note: Set up via Supabase Dashboard > Storage > Policies

-- media-studio-videos policies:
-- 1. Users can upload: bucket_id = 'media-studio-videos' AND auth.uid()::text = (storage.foldername(name))[1]
-- 2. Everyone can view: bucket_id = 'media-studio-videos'
-- 3. Users can delete their own: bucket_id = 'media-studio-videos' AND auth.uid()::text = (storage.foldername(name))[1]

-- media-studio-images policies:
-- 1. Users can upload: bucket_id = 'media-studio-images' AND auth.uid()::text = (storage.foldername(name))[1]
-- 2. Everyone can view: bucket_id = 'media-studio-images'
-- 3. Users can delete their own: bucket_id = 'media-studio-images' AND auth.uid()::text = (storage.foldername(name))[1]

-- media-studio-references policies:
-- 1. Users can upload: bucket_id = 'media-studio-references' AND auth.uid()::text = (storage.foldername(name))[1]
-- 2. Users can view their own: bucket_id = 'media-studio-references' AND auth.uid()::text = (storage.foldername(name))[1]
-- 3. Users can delete their own: bucket_id = 'media-studio-references' AND auth.uid()::text = (storage.foldername(name))[1]

-- media-studio-thumbnails policies:
-- 1. Users can upload: bucket_id = 'media-studio-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]
-- 2. Everyone can view: bucket_id = 'media-studio-thumbnails'
-- 3. Users can delete their own: bucket_id = 'media-studio-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]

-- ============================================
-- HELPER FUNCTIONS (Optional - for advanced features)
-- ============================================

-- Function: Get user's storage usage
CREATE OR REPLACE FUNCTION get_user_media_storage_usage(p_user_id UUID)
RETURNS TABLE (
  total_files BIGINT,
  total_size_mb NUMERIC,
  video_count BIGINT,
  image_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_files,
    ROUND((SUM(COALESCE(file_size, 0)) / 1024.0 / 1024.0)::NUMERIC, 2) AS total_size_mb,
    COUNT(*) FILTER (WHERE file_type = 'video')::BIGINT AS video_count,
    COUNT(*) FILTER (WHERE file_type = 'image')::BIGINT AS image_count
  FROM media_files
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get trending tags
CREATE OR REPLACE FUNCTION get_trending_media_tags(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  tag TEXT,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(tags) AS tag,
    COUNT(*)::BIGINT AS usage_count
  FROM media_files
  WHERE user_id = p_user_id
  GROUP BY tag
  ORDER BY usage_count DESC, tag ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE QUERIES for Testing
-- ============================================

-- Get all media for a user, sorted by newest first
-- SELECT * FROM media_files WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;

-- Get only favorite videos
-- SELECT * FROM media_files WHERE user_id = 'YOUR_USER_ID' AND file_type = 'video' AND is_favorite = true;

-- Search media by prompt text
-- SELECT * FROM media_files WHERE user_id = 'YOUR_USER_ID' AND to_tsvector('english', prompt) @@ to_tsquery('english', 'sunset & beach');

-- Get media with specific tag
-- SELECT * FROM media_files WHERE user_id = 'YOUR_USER_ID' AND 'landscape' = ANY(tags);

-- Get user's storage usage
-- SELECT * FROM get_user_media_storage_usage('YOUR_USER_ID');

-- Get trending tags for user
-- SELECT * FROM get_trending_media_tags('YOUR_USER_ID', 5);

-- ============================================
-- NOTES FOR IMPLEMENTATION
-- ============================================

-- 1. File naming convention: {user_id}/{timestamp}_{random}.{extension}
--    Example: a1b2c3d4-e5f6/1699123456789_a1b2c3.mp4

-- 2. Thumbnail generation should happen automatically after video generation
--    Store thumbnail in media-studio-thumbnails bucket

-- 3. When deleting a media_files record, also delete the associated files
--    from Supabase Storage (handle in application logic)

-- 4. Consider implementing a cleanup job for orphaned files in storage
--    (files in storage that don't have corresponding database records)

-- 5. For production, add rate limiting on file uploads and generation
--    to prevent abuse

-- 6. Consider adding a soft delete column (deleted_at) instead of hard deletes
--    to allow for recovery and better user experience

-- 7. Monitor storage usage per user and implement quotas based on subscription tiers

-- ============================================
-- END OF SCHEMA
-- ============================================
