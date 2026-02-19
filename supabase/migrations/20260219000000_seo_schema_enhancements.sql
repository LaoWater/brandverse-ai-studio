-- SEO Schema Enhancements: support real search data from Serper.dev
-- Adds columns for search evidence, competitor data, URL verification

-- Add real search data columns to seo_analysis
ALTER TABLE seo_analysis ADD COLUMN IF NOT EXISTS search_data JSONB DEFAULT '{}';
ALTER TABLE seo_analysis ADD COLUMN IF NOT EXISTS competitor_data JSONB DEFAULT '{}';

-- Add verification columns to engagement opportunities
ALTER TABLE seo_engagement_opportunities ADD COLUMN IF NOT EXISTS url_verified BOOLEAN DEFAULT false;
ALTER TABLE seo_engagement_opportunities ADD COLUMN IF NOT EXISTS discovered_via TEXT DEFAULT 'serper';

-- Expand platform constraint to include youtube, linkedin
ALTER TABLE seo_engagement_opportunities
  DROP CONSTRAINT IF EXISTS seo_engagement_opportunities_platform_check;
ALTER TABLE seo_engagement_opportunities
  ADD CONSTRAINT seo_engagement_opportunities_platform_check
  CHECK (platform IN ('reddit', 'twitter', 'facebook', 'youtube', 'quora', 'forum', 'linkedin', 'other'));
