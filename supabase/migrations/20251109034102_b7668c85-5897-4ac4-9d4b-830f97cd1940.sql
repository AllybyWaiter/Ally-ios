-- Update blog_posts status to support scheduled
ALTER TABLE public.blog_posts 
DROP CONSTRAINT IF EXISTS blog_posts_status_check;

ALTER TABLE public.blog_posts 
ADD CONSTRAINT blog_posts_status_check 
CHECK (status IN ('draft', 'published', 'scheduled'));

-- Add index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled 
ON public.blog_posts(status, published_at) 
WHERE status = 'scheduled';