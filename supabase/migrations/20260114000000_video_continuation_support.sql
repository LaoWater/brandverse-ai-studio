-- Video Continuation Feature Support
-- This migration ensures storage policies are correct for extracting and uploading video frames
-- The extracted frames are stored in the same 'media-studio-images' bucket as reference images

-- Ensure the media-studio-images bucket exists and is public
-- This is idempotent - won't fail if already exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-studio-images',
  'media-studio-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = COALESCE(storage.buckets.file_size_limit, 52428800),
  allowed_mime_types = COALESCE(storage.buckets.allowed_mime_types, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]);

-- Ensure the media-studio-videos bucket exists and is public (for frame extraction source)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-studio-videos',
  'media-studio-videos',
  true,
  524288000, -- 500MB limit for videos
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = COALESCE(storage.buckets.file_size_limit, 524288000),
  allowed_mime_types = COALESCE(storage.buckets.allowed_mime_types, ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]);

-- Note: The existing storage policies from 20260101000001_fix_media_studio_storage_policies.sql
-- should already handle the upload/read permissions for media-studio-images bucket.
-- The frame extraction happens client-side using Canvas API, then uploads to the same bucket.

-- If you need to verify or re-create the policies, you can run:
-- SELECT * FROM storage.objects WHERE bucket_id = 'media-studio-images' LIMIT 5;
-- to check existing data and policy effectiveness.
