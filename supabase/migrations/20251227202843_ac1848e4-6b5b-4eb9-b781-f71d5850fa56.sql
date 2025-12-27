-- Migration: Add pool_chlorine and pool_saltwater types
-- First, drop the existing check constraint, add new values, then recreate

-- Drop the existing type check constraint
ALTER TABLE public.aquariums DROP CONSTRAINT IF EXISTS aquariums_type_check;

-- Update existing 'pool' type entries to 'pool_chlorine' as the safer default
UPDATE public.aquariums 
SET type = 'pool_chlorine' 
WHERE type = 'pool';

-- Add new check constraint with updated values
ALTER TABLE public.aquariums ADD CONSTRAINT aquariums_type_check 
CHECK (type IN ('freshwater', 'saltwater', 'reef', 'planted', 'brackish', 'pool', 'pool_chlorine', 'pool_saltwater', 'spa'));

-- Add a comment for documentation
COMMENT ON COLUMN public.aquariums.type IS 'Water body type: freshwater, saltwater, reef, planted, brackish, pool_chlorine (traditional chlorine pool), pool_saltwater (salt chlorine generator pool), spa';