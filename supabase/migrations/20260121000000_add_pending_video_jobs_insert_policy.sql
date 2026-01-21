-- Add INSERT policy for pending_video_jobs
-- Allows authenticated users to create their own pending jobs from the client

CREATE POLICY "Users can insert own pending jobs" ON pending_video_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also add UPDATE policy for status changes
CREATE POLICY "Users can update own pending jobs" ON pending_video_jobs
  FOR UPDATE USING (auth.uid() = user_id);
