-- Add beta access fields to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN beta_access_granted boolean DEFAULT false,
ADD COLUMN beta_access_granted_at timestamp with time zone,
ADD COLUMN granted_by uuid REFERENCES auth.users(id);

-- Create function to check if email has beta access
CREATE OR REPLACE FUNCTION public.has_beta_access(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT beta_access_granted 
     FROM public.waitlist 
     WHERE email = user_email 
     LIMIT 1),
    false
  );
$$;

-- Create function to randomly grant beta access to N users
CREATE OR REPLACE FUNCTION public.grant_random_beta_access(count_to_grant integer, admin_user_id uuid)
RETURNS TABLE(email text, granted_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.waitlist
  SET 
    beta_access_granted = true,
    beta_access_granted_at = now(),
    granted_by = admin_user_id
  WHERE id IN (
    SELECT id 
    FROM public.waitlist 
    WHERE beta_access_granted = false
    ORDER BY RANDOM()
    LIMIT count_to_grant
  )
  RETURNING waitlist.email, waitlist.beta_access_granted_at;
END;
$$;