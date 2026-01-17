-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage all posts" ON blog_posts;

-- 1. Team members (admins + content creators) can VIEW all posts
CREATE POLICY "Team members can view all posts"
ON blog_posts FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'content_creator')
);

-- 2. Team members can INSERT new posts
CREATE POLICY "Team members can create posts"
ON blog_posts FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'content_creator')
);

-- 3. Team members can UPDATE any post
CREATE POLICY "Team members can update posts"
ON blog_posts FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'content_creator')
);

-- 4. Only admins can DELETE posts (safety measure)
CREATE POLICY "Admins can delete posts"
ON blog_posts FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'super_admin')
);