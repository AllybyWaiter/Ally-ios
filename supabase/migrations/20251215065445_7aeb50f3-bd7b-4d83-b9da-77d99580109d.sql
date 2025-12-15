-- Create push_subscriptions table to store Web Push subscription data
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, endpoint)
);

-- Create notification_preferences table for user notification settings
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT false NOT NULL,
  task_reminders_enabled BOOLEAN DEFAULT true NOT NULL,
  water_alerts_enabled BOOLEAN DEFAULT true NOT NULL,
  announcements_enabled BOOLEAN DEFAULT true NOT NULL,
  reminder_hours_before INTEGER DEFAULT 24 NOT NULL,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create notification_log table to track sent notifications and prevent duplicates
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  reference_id UUID,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, notification_type, reference_id)
);

-- Enable RLS on all tables
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
ON public.push_subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for notification_preferences
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for notification_log (service role only for inserts)
CREATE POLICY "Users can view their own notification log"
ON public.notification_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification log"
ON public.notification_log FOR INSERT
WITH CHECK (true);

-- Explicit deny for anonymous users
CREATE POLICY "Deny anonymous access to push_subscriptions"
ON public.push_subscriptions FOR ALL
USING (false);

CREATE POLICY "Deny anonymous access to notification_preferences"
ON public.notification_preferences FOR ALL
USING (false);

CREATE POLICY "Deny anonymous access to notification_log"
ON public.notification_log FOR ALL
USING (false);

-- Trigger for updated_at on push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();