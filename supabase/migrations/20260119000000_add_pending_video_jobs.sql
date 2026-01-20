-- Create pending_video_jobs table for tracking Sora video generation jobs
-- This enables recovery of videos when frontend polling stops

CREATE TABLE pending_video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  operation_name TEXT NOT NULL,  -- Sora job ID from OpenAI
  model TEXT NOT NULL,           -- 'sora-2' or 'sora-2-pro'
  mode TEXT NOT NULL,            -- 'text-to-video', 'image-to-video', 'remix'
  prompt TEXT NOT NULL,
  size TEXT NOT NULL,            -- '1280x720', '720x1280', etc.
  seconds INTEGER NOT NULL,
  input_reference_url TEXT,      -- For image-to-video mode
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for efficient user lookups
CREATE INDEX idx_pending_video_jobs_user_status ON pending_video_jobs(user_id, status);

-- Index for cleanup of expired jobs
CREATE INDEX idx_pending_video_jobs_expires_at ON pending_video_jobs(expires_at) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE pending_video_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending jobs
CREATE POLICY "Users can view own pending jobs" ON pending_video_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own pending jobs (for cleanup after recovery)
CREATE POLICY "Users can delete own pending jobs" ON pending_video_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access" ON pending_video_jobs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_pending_video_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pending_video_jobs_updated_at
  BEFORE UPDATE ON pending_video_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_video_jobs_updated_at();

-- Comment on table
COMMENT ON TABLE pending_video_jobs IS 'Tracks pending Sora video generation jobs for recovery when frontend polling stops';
