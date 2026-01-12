-- SEO Analysis Tables for Brandverse AI Studio
-- This migration creates the schema for storing SEO analysis data and engine outputs

-- Create seo_analysis table to store analysis results
CREATE TABLE IF NOT EXISTS public.seo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Analysis inputs (optional persona/audience data)
  target_audience TEXT,
  buyer_persona JSONB DEFAULT '{}',  -- stores detailed persona info
  competitors TEXT[],  -- array of competitor names/urls
  keywords TEXT[],  -- target keywords

  -- Analysis results from LLM
  analysis_result JSONB NOT NULL DEFAULT '{}',
  visibility_score INTEGER,  -- 0-100 score
  platform_scores JSONB DEFAULT '{}',  -- scores per platform (google, reddit, etc)
  recommendations JSONB DEFAULT '[]',  -- array of recommendations

  -- Metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seo_blog_posts table for generated blog content
CREATE TABLE IF NOT EXISTS public.seo_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.seo_analysis(id) ON DELETE SET NULL,

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  target_keywords TEXT[],
  seo_meta JSONB DEFAULT '{}',  -- meta title, description, etc

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Metadata
  word_count INTEGER,
  reading_time_minutes INTEGER,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seo_engagement_opportunities table for engage feature
CREATE TABLE IF NOT EXISTS public.seo_engagement_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.seo_analysis(id) ON DELETE SET NULL,

  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('reddit', 'twitter', 'facebook', 'quora', 'forum', 'other')),
  source_url TEXT,
  source_title TEXT,
  source_content TEXT,  -- snippet of the original post/thread

  -- AI-generated response
  suggested_response TEXT,
  response_reasoning TEXT,  -- why this opportunity was selected
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),

  -- User action tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'dismissed')),
  user_notes TEXT,

  -- Metadata
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_analysis_company ON public.seo_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_analysis_user ON public.seo_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_analysis_status ON public.seo_analysis(status);
CREATE INDEX IF NOT EXISTS idx_seo_blog_posts_company ON public.seo_blog_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_blog_posts_analysis ON public.seo_blog_posts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_seo_engagement_company ON public.seo_engagement_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_engagement_platform ON public.seo_engagement_opportunities(platform);
CREATE INDEX IF NOT EXISTS idx_seo_engagement_status ON public.seo_engagement_opportunities(status);

-- Enable RLS
ALTER TABLE public.seo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_engagement_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS policies for seo_analysis
CREATE POLICY "Users can view their own SEO analysis"
  ON public.seo_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SEO analysis"
  ON public.seo_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SEO analysis"
  ON public.seo_analysis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SEO analysis"
  ON public.seo_analysis FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for seo_blog_posts
CREATE POLICY "Users can view their own blog posts"
  ON public.seo_blog_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blog posts"
  ON public.seo_blog_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog posts"
  ON public.seo_blog_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blog posts"
  ON public.seo_blog_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for seo_engagement_opportunities
CREATE POLICY "Users can view their own engagement opportunities"
  ON public.seo_engagement_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engagement opportunities"
  ON public.seo_engagement_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own engagement opportunities"
  ON public.seo_engagement_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own engagement opportunities"
  ON public.seo_engagement_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seo_analysis_updated_at
  BEFORE UPDATE ON public.seo_analysis
  FOR EACH ROW EXECUTE FUNCTION update_seo_updated_at();

CREATE TRIGGER update_seo_blog_posts_updated_at
  BEFORE UPDATE ON public.seo_blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_seo_updated_at();
