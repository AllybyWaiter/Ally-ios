-- Create storage bucket for water test photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('water-test-photos', 'water-test-photos', true);

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own water test photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'water-test-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own photos
CREATE POLICY "Users can view their own water test photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'water-test-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own water test photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'water-test-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view water test photos (for sharing/display)
CREATE POLICY "Water test photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'water-test-photos');