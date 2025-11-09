-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add check constraint for valid status values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'suspended', 'banned'));

-- Create index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Add suspended_until column for temporary suspensions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone;

-- Add suspension_reason column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Create function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN status = 'active' THEN true
    WHEN status = 'suspended' AND (suspended_until IS NULL OR suspended_until > now()) THEN false
    WHEN status = 'suspended' AND suspended_until <= now() THEN true
    WHEN status = 'banned' THEN false
    ELSE true
  END
  FROM public.profiles
  WHERE user_id = _user_id
$$;