-- Step 2: Set up super_admin permissions and security

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create role_permissions junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for permissions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'All authenticated users can view permissions'
  ) THEN
    CREATE POLICY "All authenticated users can view permissions"
    ON public.permissions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Add RLS policies for role_permissions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_permissions' 
    AND policyname = 'All authenticated users can view role permissions'
  ) THEN
    CREATE POLICY "All authenticated users can view role permissions"
    ON public.role_permissions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Insert super_admin specific permissions
INSERT INTO public.permissions (name, description, category) VALUES
  ('manage_admins', 'Assign and remove admin roles', 'admin'),
  ('manage_system', 'Full system access and configuration', 'admin'),
  ('view_all_data', 'Access to all data across the system', 'admin'),
  ('manage_permissions', 'Modify role permissions and capabilities', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to super_admin
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Update user_roles RLS policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage non-admin roles" ON public.user_roles;

-- Super admins can manage all roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Regular admins can manage non-admin roles only
CREATE POLICY "Admins can manage non-admin roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND role NOT IN ('admin', 'super_admin')
);