-- Phase 1: Update Profiles Table Policies to authenticated role only

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate with authenticated role only
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Phase 2: Update Contacts Table Policies to authenticated role only

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;

-- Recreate with authenticated role only
CREATE POLICY "Admins can view all contacts" 
ON public.contacts FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contacts" 
ON public.contacts FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contacts" 
ON public.contacts FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

-- Phase 3: Add Explicit Deny Policies for Anon Role (Defense in Depth)

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to contacts"
ON public.contacts
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);