-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Simple function that calls the edge function via HTTP
CREATE OR REPLACE FUNCTION public.process_pending_video_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call edge function using pg_net
  -- The edge function handles everything: fetch pending jobs, check OpenAI, download videos
  PERFORM net.http_post(
    url := 'https://vcgaqikuaaazjpwyzvwb.supabase.co/functions/v1/process-pending-videos',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule cron job every 5 minutes
SELECT cron.schedule(
  'process-pending-video-jobs',
  '*/5 * * * *',
  $$SELECT public.process_pending_video_jobs()$$
);
