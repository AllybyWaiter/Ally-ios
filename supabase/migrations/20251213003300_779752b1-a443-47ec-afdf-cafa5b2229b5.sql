-- Drop overly permissive INSERT policy on contacts
DROP POLICY IF EXISTS "Anyone can insert contacts" ON public.contacts;

-- Create restrictive policy: Only service_role can insert (via edge function)
-- This prevents direct client-side inserts, forcing all submissions through the rate-limited edge function
CREATE POLICY "Service role can insert contacts" ON public.contacts
FOR INSERT TO service_role
WITH CHECK (true);

-- Drop overly permissive INSERT policy on login_history
DROP POLICY IF EXISTS "System can insert login history" ON public.login_history;

-- Create restrictive policy: Only service_role can insert
CREATE POLICY "Service role can insert login history" ON public.login_history
FOR INSERT TO service_role
WITH CHECK (true);