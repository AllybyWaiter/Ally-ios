-- Assign super_admin role to CEO/founder
-- This migration sets up the initial super_admin for the application

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'stephensjacob3@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure the user has the basic 'user' role (should already exist from signup trigger)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
WHERE email = 'stephensjacob3@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
