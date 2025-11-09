-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, success, error
  target_audience TEXT NOT NULL DEFAULT 'all', -- all, free, plus, gold, enterprise, custom
  custom_user_ids UUID[],
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, cancelled
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  send_email BOOLEAN NOT NULL DEFAULT false,
  send_in_app BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_announcements_status ON public.announcements(status);
CREATE INDEX idx_announcements_scheduled_at ON public.announcements(scheduled_at);
CREATE INDEX idx_announcements_target_audience ON public.announcements(target_audience);

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can manage all announcements
CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create user_notifications table for in-app notifications
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(read);
CREATE INDEX idx_user_notifications_announcement_id ON public.user_notifications(announcement_id);

-- Enable Row Level Security
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Only system/admins can insert notifications
CREATE POLICY "Admins can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_announcement_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION update_announcement_updated_at();