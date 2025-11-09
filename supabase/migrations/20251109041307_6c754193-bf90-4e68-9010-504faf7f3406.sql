-- Create function to get user permissions based on their roles
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(permission_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT p.name
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role = rp.role
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = _user_id;
$$;