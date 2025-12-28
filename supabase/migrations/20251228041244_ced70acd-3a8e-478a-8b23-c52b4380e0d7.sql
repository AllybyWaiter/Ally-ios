-- Fix: Remove admin access to raw profile data
-- Admins should use the get_masked_user_profiles() RPC function instead
-- This prevents exposure of email, name, and location data

-- Drop the existing policy that exposes data to admins
DROP POLICY IF EXISTS "Admins can view limited profile data" ON public.profiles;

-- Users can only view their own profile (no admin access to raw data)
-- Admins must use get_masked_user_profiles() RPC function for user management
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Add a comment explaining the security design
COMMENT ON TABLE public.profiles IS 'User profile data. RLS restricts all SELECT to own profile only. Admins must use get_masked_user_profiles() RPC for masked access to user data.';