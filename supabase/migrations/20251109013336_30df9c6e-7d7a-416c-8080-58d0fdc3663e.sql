-- Add unit_preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN unit_preference TEXT DEFAULT 'imperial' CHECK (unit_preference IN ('metric', 'imperial'));