-- Create image_control table for storing image control settings
CREATE TABLE public.image_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  level INTEGER NOT NULL CHECK (level IN (1, 2)), -- 1 for company-wide, 2 for platform-specific
  platform_type platform_type NULL, -- NULL for level 1, specific platform for level 2
  enabled BOOLEAN NOT NULL DEFAULT false,
  image_style TEXT,
  image_ratio TEXT,
  visual_guidance TEXT,
  caption_guidance TEXT,
  starting_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique constraints
  UNIQUE(user_id, company_id, level, platform_type)
);

-- Enable RLS
ALTER TABLE public.image_control ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own image control settings" 
ON public.image_control 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image control settings" 
ON public.image_control 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image control settings" 
ON public.image_control 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own image control settings" 
ON public.image_control 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_image_control_updated_at
BEFORE UPDATE ON public.image_control
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();