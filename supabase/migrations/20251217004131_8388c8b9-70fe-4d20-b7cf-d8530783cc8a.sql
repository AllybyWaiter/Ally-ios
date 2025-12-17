-- Create storage bucket for plant photos
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-photos', 'plant-photos', true);

-- Storage policies for plant photos
CREATE POLICY "Users can upload their own plant photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own plant photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own plant photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Plant photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-photos');

-- Create plant_photos table
CREATE TABLE public.plant_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  taken_at DATE DEFAULT CURRENT_DATE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plant_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for plant_photos
CREATE POLICY "Users can view their own plant photos"
ON public.plant_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plant photos"
ON public.plant_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plant photos"
ON public.plant_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plant photos"
ON public.plant_photos FOR DELETE
USING (auth.uid() = user_id);

-- Add primary_photo_url to plants table
ALTER TABLE public.plants ADD COLUMN primary_photo_url TEXT;