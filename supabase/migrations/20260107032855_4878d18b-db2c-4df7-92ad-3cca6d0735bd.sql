-- Fix #1: Add INSERT policy for login_history table to resolve RLS violations
-- This allows users to insert their own login records

CREATE POLICY "Users can insert their own login history"
ON public.login_history
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix #3: Tighten overly permissive RLS policies
-- Note: We're only fixing the most critical ones that have INSERT/UPDATE/DELETE with true checks