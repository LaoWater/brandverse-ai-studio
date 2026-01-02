-- Create storage bucket for company logos
-- This allows users to upload and manage company logos

-- Create the company-logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy 1: Allow authenticated users to upload logos to their own folder
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own logos
CREATE POLICY "Authenticated users can update their own company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own logos
CREATE POLICY "Authenticated users can delete their own company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to all company logos
-- This is needed so logos can be displayed publicly in the app
CREATE POLICY "Public can read company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');
