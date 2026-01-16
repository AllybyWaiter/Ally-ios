-- Assign blog permissions to content_creator role
INSERT INTO role_permissions (role, permission_id)
SELECT 'content_creator'::app_role, id FROM permissions 
WHERE name IN ('manage_blog', 'publish_blog')
ON CONFLICT DO NOTHING;

-- Assign content_creator role to harrisontd03@gmail.com
INSERT INTO user_roles (user_id, role)
VALUES ('201560c4-2fc4-4449-b53f-563d62d10da7', 'content_creator'::app_role)
ON CONFLICT DO NOTHING;