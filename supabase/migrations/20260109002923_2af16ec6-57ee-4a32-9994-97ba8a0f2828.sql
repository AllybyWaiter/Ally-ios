
-- Fix remaining public form policies with basic validation
-- These are intentionally public but should have some constraints

-- 1. Partner applications: Require basic fields and validate email format
DROP POLICY IF EXISTS "Anyone can submit partner applications" ON public.partner_applications;
CREATE POLICY "Public can submit partner applications with valid data" 
ON public.partner_applications 
FOR INSERT 
WITH CHECK (
  email IS NOT NULL 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND full_name IS NOT NULL
  AND length(full_name) >= 2
);

-- 2. Status subscribers: Validate email format
DROP POLICY IF EXISTS "Anyone can subscribe to status updates" ON public.status_subscribers;
CREATE POLICY "Public can subscribe with valid email" 
ON public.status_subscribers 
FOR INSERT 
WITH CHECK (
  email IS NOT NULL 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 3. Waitlist: Validate email format for public submissions
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Public can join waitlist with valid email" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (
  email IS NOT NULL 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);
