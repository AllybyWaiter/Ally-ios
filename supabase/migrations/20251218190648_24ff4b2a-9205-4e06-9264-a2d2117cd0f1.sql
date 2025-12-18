-- Add health alerts preferences to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS health_alerts_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS sound_health_alerts boolean NOT NULL DEFAULT true;