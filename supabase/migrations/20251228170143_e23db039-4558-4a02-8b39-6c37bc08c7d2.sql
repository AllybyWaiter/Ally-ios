-- Create aquarium_photos table
CREATE TABLE public.aquarium_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  taken_at DATE DEFAULT CURRENT_DATE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aquarium_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own aquarium photos" 
  ON public.aquarium_photos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own aquarium photos" 
  ON public.aquarium_photos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aquarium photos" 
  ON public.aquarium_photos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own aquarium photos" 
  ON public.aquarium_photos FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for aquarium photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('aquarium-photos', 'aquarium-photos', true);

-- Storage policies
CREATE POLICY "Users can upload aquarium photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'aquarium-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their aquarium photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'aquarium-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their aquarium photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'aquarium-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Aquarium photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'aquarium-photos');

-- Add primary_photo_url to aquariums if not exists
ALTER TABLE public.aquariums ADD COLUMN IF NOT EXISTS primary_photo_url TEXT;