-- Drop the existing type check constraint
ALTER TABLE public.aquariums DROP CONSTRAINT IF EXISTS aquariums_type_check;

-- Add updated constraint that includes pool and spa types
ALTER TABLE public.aquariums ADD CONSTRAINT aquariums_type_check 
CHECK (type IN ('freshwater', 'saltwater', 'brackish', 'reef', 'pond', 'pool', 'spa'));