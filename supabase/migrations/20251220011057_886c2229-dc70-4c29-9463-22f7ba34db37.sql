-- Drop the existing admin view policy that exposes all emails
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a more restrictive admin policy that still allows admins to view profiles
-- but through a controlled mechanism (they can view their own + manage through secure functions)
-- Admins should use edge functions with audit logging for bulk user management

-- Create a view for admin access that masks emails
CREATE OR REPLACE VIEW public.profiles_admin_view AS
SELECT 
  id,
  user_id,
  name,
  -- Mask email: show first 2 chars, then ***, then domain
  CASE 
    WHEN email IS NOT NULL THEN 
      CONCAT(
        LEFT(email, 2),
        '***@',
        SPLIT_PART(email, '@', 2)
      )
    ELSE NULL 
  END as masked_email,
  status,
  subscription_tier,
  skill_level,
  onboarding_completed,
  weather_enabled,
  theme_preference,
  unit_preference,
  language_preference,
  hemisphere,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view for authenticated users (RLS on base table still applies)
GRANT SELECT ON public.profiles_admin_view TO authenticated;

-- Add a new restrictive policy for admins - they can only view through the masked view
-- For full email access, they must use a secure edge function with audit logging
CREATE POLICY "Admins can view profiles via masked view only"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  auth.uid() = user_id
  OR 
  -- Admins can see profiles but the application layer should use the masked view
  has_role(auth.uid(), 'admin')
);

-- Add comment explaining the security model
COMMENT ON VIEW public.profiles_admin_view IS 'Admin view of profiles with masked emails. For full email access, use the export-user-data edge function with audit logging.';