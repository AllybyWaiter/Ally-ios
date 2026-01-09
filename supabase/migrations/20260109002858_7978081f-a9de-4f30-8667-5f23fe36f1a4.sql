
-- Fix overly permissive RLS policies by restricting "Service role" inserts to actual service role
-- This prevents anonymous users from inserting into these tables

-- 1. Fix ai_alerts: Only service role should insert
DROP POLICY IF EXISTS "Service role can insert ai_alerts" ON public.ai_alerts;
CREATE POLICY "Service role can insert ai_alerts" 
ON public.ai_alerts 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 2. Fix contacts: Only service role should insert (from edge functions)
DROP POLICY IF EXISTS "Service role can insert contacts" ON public.contacts;
CREATE POLICY "Service role can insert contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 3. Fix login_history: Only service role should insert
DROP POLICY IF EXISTS "Service role can insert login history" ON public.login_history;
CREATE POLICY "Service role can insert login history" 
ON public.login_history 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 4. Fix notification_log: Only service role should insert
DROP POLICY IF EXISTS "Service role can insert notification log" ON public.notification_log;
CREATE POLICY "Service role can insert notification log" 
ON public.notification_log 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 5. Fix water_test_alerts: Only service role should insert
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.water_test_alerts;
CREATE POLICY "Service role can insert alerts" 
ON public.water_test_alerts 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 6. Fix waitlist service role policy
DROP POLICY IF EXISTS "Service role can insert to waitlist" ON public.waitlist;
CREATE POLICY "Service role can insert to waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');
