-- Create activity logs table for tracking user actions
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only system can insert activity logs (via service role)
CREATE POLICY "System can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Create login history table
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT
);

-- Create index for faster queries
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at DESC);

-- Enable Row Level Security
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own login history
CREATE POLICY "Users can view their own login history"
ON public.login_history
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all login history
CREATE POLICY "Admins can view all login history"
ON public.login_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only system can insert login history (via service role)
CREATE POLICY "System can insert login history"
ON public.login_history
FOR INSERT
WITH CHECK (true);