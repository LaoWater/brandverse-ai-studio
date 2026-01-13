-- Enable pg_cron extension (Supabase has this available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily credit reset at midnight UTC
-- This calls the existing reset_daily_credits function
SELECT cron.schedule(
  'reset-daily-credits',           -- job name
  '0 0 * * *',                     -- cron expression: every day at midnight UTC
  $$SELECT public.reset_daily_credits()$$
);