-- Phase 2.1: Make onboarding_completed NOT NULL with default false
-- First update any NULL values to false
UPDATE public.profiles
SET onboarding_completed = false
WHERE onboarding_completed IS NULL;

-- Then alter the column to NOT NULL with default false
ALTER TABLE public.profiles
ALTER COLUMN onboarding_completed SET NOT NULL,
ALTER COLUMN onboarding_completed SET DEFAULT false;