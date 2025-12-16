-- Add sound preference columns to notification_preferences table
ALTER TABLE notification_preferences 
ADD COLUMN sound_task_reminders boolean NOT NULL DEFAULT true,
ADD COLUMN sound_water_alerts boolean NOT NULL DEFAULT true,
ADD COLUMN sound_announcements boolean NOT NULL DEFAULT true;