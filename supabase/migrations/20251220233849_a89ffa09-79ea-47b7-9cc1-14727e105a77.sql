-- Allow admins to view all water tests for analytics
CREATE POLICY "Admins can view all water tests"
  ON water_tests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));