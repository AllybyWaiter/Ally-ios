-- Allow admins to view all livestock for analytics
CREATE POLICY "Admins can view all livestock"
  ON livestock
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all plants for analytics
CREATE POLICY "Admins can view all plants"
  ON plants
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all equipment for analytics
CREATE POLICY "Admins can view all equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all maintenance tasks for analytics
CREATE POLICY "Admins can view all maintenance_tasks"
  ON maintenance_tasks
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));