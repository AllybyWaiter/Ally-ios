-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.blog_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.blog_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Create blog_post_categories junction table
CREATE TABLE IF NOT EXISTS public.blog_post_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, category_id)
);

-- Enable RLS
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Post categories are viewable by everyone" 
ON public.blog_post_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage post categories" 
ON public.blog_post_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Create updated_at trigger for categories
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Aquarium Care', 'aquarium-care', 'General aquarium maintenance and care tips'),
  ('Fish Species', 'fish-species', 'Information about different fish species'),
  ('Water Quality', 'water-quality', 'Water testing and quality management'),
  ('Equipment', 'equipment', 'Aquarium equipment reviews and guides'),
  ('Beginner Guides', 'beginner-guides', 'Getting started with aquarium keeping')
ON CONFLICT (slug) DO NOTHING;