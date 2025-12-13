-- Add hemisphere column to profiles for seasonal task suggestions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hemisphere text DEFAULT 'northern';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.hemisphere IS 'User hemisphere (northern/southern) for seasonal pool/spa task reminders';