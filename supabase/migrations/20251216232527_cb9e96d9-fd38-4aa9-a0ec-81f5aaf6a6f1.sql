-- Create livestock_photos table
CREATE TABLE public.livestock_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livestock_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  taken_at DATE DEFAULT CURRENT_DATE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add primary_photo_url to livestock table
ALTER TABLE public.livestock ADD COLUMN primary_photo_url TEXT;

-- Enable RLS
ALTER TABLE public.livestock_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own livestock photos"
ON public.livestock_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own livestock photos"
ON public.livestock_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own livestock photos"
ON public.livestock_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own livestock photos"
ON public.livestock_photos FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for livestock photos
INSERT INTO storage.buckets (id, name, public) VALUES ('livestock-photos', 'livestock-photos', true);

-- Storage policies
CREATE POLICY "Users can view livestock photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'livestock-photos');

CREATE POLICY "Users can upload their own livestock photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'livestock-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own livestock photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'livestock-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own livestock photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'livestock-photos' AND auth.uid()::text = (storage.foldername(name))[1]);