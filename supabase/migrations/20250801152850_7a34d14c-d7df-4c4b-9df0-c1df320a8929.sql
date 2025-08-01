-- Create public storage bucket for starting images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('starting-images', 'starting-images', true);

-- Create policies for starting images bucket
CREATE POLICY "Users can upload their own starting images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'starting-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Starting images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'starting-images');

CREATE POLICY "Users can update their own starting images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'starting-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own starting images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'starting-images' AND auth.uid()::text = (storage.foldername(name))[1]);