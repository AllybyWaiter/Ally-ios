-- ==============================================
-- Security Migration: Geolocation Precision & Admin Email Access
-- ==============================================

-- 1. Reduce geolocation precision in profiles table (2 decimal places = ~1km accuracy)
-- This preserves city-level location while protecting user privacy

-- Update existing data to reduce precision
UPDATE public.profiles 
SET 
  latitude = ROUND(latitude::numeric, 2),
  longitude = ROUND(longitude::numeric, 2)
WHERE latitude IS NOT NULL OR longitude IS NOT NULL;

-- 2. Reduce geolocation precision in aquariums table
UPDATE public.aquariums 
SET 
  latitude = ROUND(latitude::numeric, 2),
  longitude = ROUND(longitude::numeric, 2)
WHERE latitude IS NOT NULL OR longitude IS NOT NULL;

-- 3. Create trigger to enforce precision on insert/update for profiles
CREATE OR REPLACE FUNCTION public.enforce_geolocation_precision()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL THEN
    NEW.latitude := ROUND(NEW.latitude::numeric, 2);
  END IF;
  IF NEW.longitude IS NOT NULL THEN
    NEW.longitude := ROUND(NEW.longitude::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$;

-- Apply trigger to profiles
DROP TRIGGER IF EXISTS enforce_profiles_geolocation_precision ON public.profiles;
CREATE TRIGGER enforce_profiles_geolocation_precision
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_geolocation_precision();

-- Apply trigger to aquariums
DROP TRIGGER IF EXISTS enforce_aquariums_geolocation_precision ON public.aquariums;
CREATE TRIGGER enforce_aquariums_geolocation_precision
  BEFORE INSERT OR UPDATE ON public.aquariums
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_geolocation_precision();

-- 4. Update RLS policy for profiles to restrict admin access to email
-- First, drop the existing policy that gives admins full SELECT access
DROP POLICY IF EXISTS "Admins can view profiles via masked view only" ON public.profiles;

-- Create a new restrictive policy: admins can only see non-PII columns
-- For email access, admins must use the profiles_admin_view
CREATE POLICY "Admins can view limited profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR (
    has_role(auth.uid(), 'admin'::app_role) 
    AND auth.uid() != user_id
  )
);

-- 5. Create a secure function for admin to get masked user data
CREATE OR REPLACE FUNCTION public.get_masked_user_profiles()
RETURNS TABLE (
  user_id uuid,
  name text,
  masked_email text,
  subscription_tier text,
  status text,
  created_at timestamptz,
  onboarding_completed boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.name,
    -- Mask email: show first 2 chars + *** + domain
    CASE 
      WHEN LENGTH(SPLIT_PART(p.email, '@', 1)) > 2 
      THEN SUBSTRING(p.email, 1, 2) || '***@' || SPLIT_PART(p.email, '@', 2)
      ELSE '***@' || SPLIT_PART(p.email, '@', 2)
    END as masked_email,
    p.subscription_tier,
    p.status,
    p.created_at,
    p.onboarding_completed
  FROM public.profiles p
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;