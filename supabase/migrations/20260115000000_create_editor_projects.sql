-- Editor Projects Table
-- Stores video editor projects with auto-save support

-- Create the editor_projects table
CREATE TABLE IF NOT EXISTS public.editor_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  -- Project metadata
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  thumbnail_url TEXT,

  -- Project data stored as JSONB for flexibility
  -- Contains: clips[], settings, timeline state
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'exported', 'archived')),
  total_duration REAL DEFAULT 0, -- Total timeline duration in seconds
  clip_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ DEFAULT NOW(),

  -- For future: exported video reference
  exported_media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_editor_projects_user_id ON public.editor_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_editor_projects_company_id ON public.editor_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_editor_projects_updated_at ON public.editor_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_editor_projects_status ON public.editor_projects(status);

-- Enable RLS
ALTER TABLE public.editor_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own projects
CREATE POLICY "Users can view their own projects"
  ON public.editor_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.editor_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.editor_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.editor_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_editor_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_editor_project_timestamp
  BEFORE UPDATE ON public.editor_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_editor_project_timestamp();

-- Comment on table
COMMENT ON TABLE public.editor_projects IS 'Stores video editor projects with auto-save support';
COMMENT ON COLUMN public.editor_projects.project_data IS 'JSONB containing clips array, settings, and timeline state';
