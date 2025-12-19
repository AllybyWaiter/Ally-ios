-- Fix push_subscriptions RLS policies
-- Remove the overly permissive service role policy and make policies stricter

-- First, drop the problematic service role policy
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.push_subscriptions;

-- Add UPDATE policy for users to update their own subscriptions (was missing)
CREATE POLICY "Users can update their own subscriptions" 
ON public.push_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix profiles RLS - add DELETE policy for users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Strengthen admin access to profiles - admins should only be able to view, not modify arbitrarily
-- Drop the current admin SELECT policy and recreate with proper restrictions
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin update policy with restrictions (super_admin only for full management)
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (is_super_admin(auth.uid()));