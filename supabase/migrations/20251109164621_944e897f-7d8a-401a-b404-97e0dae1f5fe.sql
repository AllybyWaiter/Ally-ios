-- Add author_name column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN author_name TEXT;