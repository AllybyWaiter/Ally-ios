-- Add title and body columns to notification_log for delivery history
ALTER TABLE notification_log
ADD COLUMN title text NOT NULL DEFAULT '',
ADD COLUMN body text NOT NULL DEFAULT '';