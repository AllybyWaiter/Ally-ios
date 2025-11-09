-- Add skill_level column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced'));

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.skill_level IS 'User aquarium experience level: beginner, intermediate, or advanced';