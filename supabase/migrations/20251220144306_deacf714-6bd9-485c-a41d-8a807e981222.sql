-- Create role audit log table for tracking role changes
CREATE TABLE public.role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_roles TEXT[] NOT NULL DEFAULT '{}',
  new_roles TEXT[] NOT NULL DEFAULT '{}',
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.role_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert audit logs
CREATE POLICY "Admins can insert role audit logs"
ON public.role_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_role_audit_log_target_user ON public.role_audit_log(target_user_id);
CREATE INDEX idx_role_audit_log_admin_user ON public.role_audit_log(admin_user_id);
CREATE INDEX idx_role_audit_log_created_at ON public.role_audit_log(created_at DESC);