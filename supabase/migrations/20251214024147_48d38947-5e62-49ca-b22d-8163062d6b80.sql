-- ============================================
-- Harden login_history table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own login history" ON public.login_history;
DROP POLICY IF EXISTS "Admins can view all login history" ON public.login_history;
DROP POLICY IF EXISTS "Service role can insert login history" ON public.login_history;

-- Recreate with authenticated role only
CREATE POLICY "Users can view their own login history" 
ON public.login_history FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login history" 
ON public.login_history FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

-- Service role insert (edge functions) - keep permissive for backend use
CREATE POLICY "Service role can insert login history" 
ON public.login_history FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Explicit deny for anonymous
CREATE POLICY "Deny anonymous access to login_history"
ON public.login_history
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- ============================================
-- Harden activity_logs table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- Recreate with authenticated role only
CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can insert their own activity logs
CREATE POLICY "Users can insert their own activity logs" 
ON public.activity_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Explicit deny for anonymous
CREATE POLICY "Deny anonymous access to activity_logs"
ON public.activity_logs
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- ============================================
-- Harden waitlist table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can update waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can delete waitlist" ON public.waitlist;

-- Public insert stays permissive (unauthenticated users need to join waitlist)
-- But we use service_role for actual insertion via edge function
CREATE POLICY "Service role can insert to waitlist" 
ON public.waitlist FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Admins with authenticated role
CREATE POLICY "Admins can view waitlist" 
ON public.waitlist FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist" 
ON public.waitlist FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete waitlist" 
ON public.waitlist FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

-- Note: We explicitly allow anon INSERT for waitlist signup via client
-- But restrict all other operations
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================
-- Harden water_test_alerts table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.water_test_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.water_test_alerts;
DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.water_test_alerts;
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.water_test_alerts;

-- Recreate with authenticated role only
CREATE POLICY "Users can view their own alerts" 
ON public.water_test_alerts FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.water_test_alerts FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" 
ON public.water_test_alerts FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Service role insert for edge functions
CREATE POLICY "Service role can insert alerts" 
ON public.water_test_alerts FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Explicit deny for anonymous
CREATE POLICY "Deny anonymous access to water_test_alerts"
ON public.water_test_alerts
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);