-- Create function to increment media view count
CREATE OR REPLACE FUNCTION public.increment_media_view_count(
  media_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment the view count for the specified media file
  UPDATE public.media_files
  SET
    view_count = view_count + 1,
    updated_at = now()
  WHERE id = media_id;

  -- Return true if a row was updated, false otherwise
  RETURN FOUND;
END;
$$;
