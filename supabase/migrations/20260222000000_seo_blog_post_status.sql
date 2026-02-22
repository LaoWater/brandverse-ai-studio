-- Add 'posted' to seo_blog_posts status CHECK constraint
-- Current constraint allows: 'draft', 'published', 'archived'
-- Adding 'posted' for workflow: Draft -> Posted -> Published -> Archived

ALTER TABLE seo_blog_posts
  DROP CONSTRAINT IF EXISTS seo_blog_posts_status_check;

ALTER TABLE seo_blog_posts
  ADD CONSTRAINT seo_blog_posts_status_check
  CHECK (status IN ('draft', 'posted', 'published', 'archived'));
