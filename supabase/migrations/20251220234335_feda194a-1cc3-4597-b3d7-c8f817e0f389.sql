-- Allow admins to view all aquariums for analytics
CREATE POLICY "Admins can view all aquariums"
  ON aquariums
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));