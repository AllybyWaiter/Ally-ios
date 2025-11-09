-- Create missing permissions that the Admin page requires
INSERT INTO permissions (name, description, category) VALUES
  ('manage_users', 'Manage user accounts and profiles', 'admin'),
  ('manage_roles', 'Manage user roles and assignments', 'admin'),
  ('manage_blog', 'Create, edit, and delete blog posts', 'content'),
  ('publish_blog', 'Publish and schedule blog posts', 'content'),
  ('manage_announcements', 'Create and send system announcements', 'admin'),
  ('moderate_support', 'View and respond to support tickets', 'support')
ON CONFLICT (name) DO NOTHING;

-- Grant all these permissions to super_admin role
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions 
WHERE name IN ('manage_users', 'manage_roles', 'manage_blog', 'publish_blog', 'manage_announcements', 'moderate_support')
ON CONFLICT (role, permission_id) DO NOTHING;