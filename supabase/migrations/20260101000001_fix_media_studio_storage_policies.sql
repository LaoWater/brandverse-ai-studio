-- Fix Row Level Security policies for media-studio-images storage bucket
-- This allows users to upload reference images and read generated images

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload reference images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read all images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to media-studio-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from media-studio-images" ON storage.objects;

-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload to media-studio-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-studio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-studio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media-studio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-studio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to all images in the bucket
-- This is needed so generated images can be displayed publicly
CREATE POLICY "Public can read from media-studio-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media-studio-images');

-- Ensure the bucket exists and is public
-- Note: This is idempotent, won't fail if bucket already exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-studio-images', 'media-studio-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
