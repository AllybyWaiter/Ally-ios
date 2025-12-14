-- Add location columns to aquariums table for per-aquatic-space location tracking
ALTER TABLE public.aquariums 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC,
ADD COLUMN location_name TEXT;