-- Add weather alerts preferences to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS weather_alerts_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sound_weather_alerts boolean NOT NULL DEFAULT true;

-- Create table to track sent weather alerts (prevent duplicates)
CREATE TABLE public.weather_alerts_notified (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  alert_id text NOT NULL,
  severity text NOT NULL,
  headline text NOT NULL,
  expires_at timestamp with time zone,
  notified_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_id)
);

-- Enable RLS
ALTER TABLE public.weather_alerts_notified ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Deny anonymous access to weather_alerts_notified"
ON public.weather_alerts_notified
AS RESTRICTIVE
FOR ALL
USING (false);

CREATE POLICY "Service role can manage weather alerts notified"
ON public.weather_alerts_notified
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view their own weather alert history"
ON public.weather_alerts_notified
FOR SELECT
USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_weather_alerts_notified_user_alert ON public.weather_alerts_notified(user_id, alert_id);
CREATE INDEX idx_weather_alerts_notified_expires ON public.weather_alerts_notified(expires_at);