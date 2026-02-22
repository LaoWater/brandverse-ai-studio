-- SEO Level-Up: Keywords, Article Ratings, Website Audits, 4-Pillar Analysis
-- Migration: 20260223000000

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. seo_keywords — Persistent keyword management per company
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'primary'
    CHECK (category IN ('primary', 'secondary', 'long-tail', 'brand', 'competitor')),
  times_used_in_articles INT NOT NULL DEFAULT 0,
  times_used_in_analysis INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  avg_article_rating NUMERIC(3,2) DEFAULT NULL,
  search_volume_estimate TEXT DEFAULT NULL,
  difficulty_estimate TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, keyword)
);

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own keywords"
  ON public.seo_keywords
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_seo_keywords_company ON public.seo_keywords(company_id);
CREATE INDEX idx_seo_keywords_active ON public.seo_keywords(company_id, is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. seo_article_ratings — User ratings for generated articles
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.seo_article_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES public.seo_blog_posts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT DEFAULT NULL,
  keywords_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blog_post_id, user_id)
);

ALTER TABLE public.seo_article_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own article ratings"
  ON public.seo_article_ratings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_seo_article_ratings_post ON public.seo_article_ratings(blog_post_id);
CREATE INDEX idx_seo_article_ratings_company ON public.seo_article_ratings(company_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. seo_website_audits — Technical website analysis results (Pillar 4)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.seo_website_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.seo_analysis(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,

  -- Technical metrics
  http_status INT,
  response_time_ms INT,
  content_type TEXT,
  raw_html_length INT,
  visible_text_length INT,
  js_dependent_content BOOLEAN DEFAULT FALSE,

  -- Meta tags
  has_meta_title BOOLEAN DEFAULT FALSE,
  meta_title TEXT,
  has_meta_description BOOLEAN DEFAULT FALSE,
  meta_description TEXT,
  has_og_tags BOOLEAN DEFAULT FALSE,
  has_canonical_url BOOLEAN DEFAULT FALSE,
  canonical_url TEXT,

  -- Robots / Sitemap
  has_robots_txt BOOLEAN DEFAULT FALSE,
  has_sitemap BOOLEAN DEFAULT FALSE,

  -- Technology
  inferred_tech_stack JSONB DEFAULT '[]',
  is_spa BOOLEAN DEFAULT FALSE,
  has_ssr BOOLEAN DEFAULT FALSE,

  -- Scores & Issues
  crawlability_score INT DEFAULT 0 CHECK (crawlability_score >= 0 AND crawlability_score <= 100),
  issues JSONB DEFAULT '[]',
  technical_summary TEXT,
  recommendations JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_website_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own website audits"
  ON public.seo_website_audits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_seo_website_audits_company ON public.seo_website_audits(company_id);
CREATE INDEX idx_seo_website_audits_analysis ON public.seo_website_audits(analysis_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ALTER seo_analysis — Add 4-pillar columns
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.seo_analysis
  ADD COLUMN IF NOT EXISTS pillar_scores JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pillar_details JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketing_plan JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website_audit_id UUID REFERENCES public.seo_website_audits(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. ALTER seo_blog_posts — Add rating columns
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.seo_blog_posts
  ADD COLUMN IF NOT EXISTS user_rating INT CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)),
  ADD COLUMN IF NOT EXISTS rating_feedback TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. RPC: update_keyword_stats — Atomic keyword usage/rating update
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_keyword_stats(
  _company_id UUID,
  _keywords TEXT[],
  _increment_articles BOOLEAN DEFAULT FALSE,
  _increment_analysis BOOLEAN DEFAULT FALSE,
  _new_rating NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.seo_keywords
  SET
    times_used_in_articles = CASE WHEN _increment_articles THEN times_used_in_articles + 1 ELSE times_used_in_articles END,
    times_used_in_analysis = CASE WHEN _increment_analysis THEN times_used_in_analysis + 1 ELSE times_used_in_analysis END,
    avg_article_rating = CASE
      WHEN _new_rating IS NOT NULL AND avg_article_rating IS NULL THEN _new_rating
      WHEN _new_rating IS NOT NULL AND avg_article_rating IS NOT NULL THEN
        ROUND((avg_article_rating * times_used_in_articles + _new_rating) / (times_used_in_articles + 1), 2)
      ELSE avg_article_rating
    END,
    last_used_at = now(),
    updated_at = now()
  WHERE company_id = _company_id
    AND keyword = ANY(_keywords)
    AND is_active = TRUE;
END;
$$;
