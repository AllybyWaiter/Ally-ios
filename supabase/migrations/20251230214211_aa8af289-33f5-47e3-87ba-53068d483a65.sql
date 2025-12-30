-- Fix 1: Update grant_random_beta_access function with server-side admin verification
CREATE OR REPLACE FUNCTION public.grant_random_beta_access(
  count_to_grant integer, 
  admin_user_id uuid
)
RETURNS TABLE(email text, granted_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has admin role
  IF NOT has_role(admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can grant beta access';
  END IF;
  
  -- Verify caller matches passed admin_user_id to prevent impersonation
  IF admin_user_id != auth.uid() THEN
    RAISE EXCEPTION 'admin_user_id must match authenticated user';
  END IF;
  
  RETURN QUERY
  UPDATE public.waitlist
  SET 
    beta_access_granted = true,
    beta_access_granted_at = now(),
    granted_by = admin_user_id
  WHERE id IN (
    SELECT w.id 
    FROM public.waitlist w
    WHERE w.beta_access_granted = false
    ORDER BY RANDOM()
    LIMIT count_to_grant
  )
  RETURNING waitlist.email, waitlist.beta_access_granted_at;
END;
$$;

-- Fix 2: Drop unused profiles_admin_view that has no RLS
DROP VIEW IF EXISTS public.profiles_admin_view;