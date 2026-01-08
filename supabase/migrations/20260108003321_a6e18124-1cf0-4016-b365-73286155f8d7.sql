-- Phase 1: Fix cron job to use service role key instead of anon key
SELECT cron.unschedule('check-scheduled-notifications');

SELECT cron.schedule(
  'check-scheduled-notifications',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pomvsimhphgbqxreyhfp.supabase.co/functions/v1/scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Phase 3: Add notification_log cleanup - delete entries older than 90 days
-- Create a cron job to clean up old notification logs
SELECT cron.schedule(
  'cleanup-notification-log',
  '0 3 * * *',
  $$
  DELETE FROM public.notification_log 
  WHERE sent_at < NOW() - INTERVAL '90 days';
  $$
);

-- Phase 4: Add unique partial index for notification deduplication
-- This prevents race condition duplicates when reference_id is set
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_log_dedup 
ON public.notification_log (user_id, notification_type, reference_id) 
WHERE reference_id IS NOT NULL;