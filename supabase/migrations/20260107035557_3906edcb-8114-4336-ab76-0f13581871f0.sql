-- Fix UUID LIKE operator error in notification_log table
-- The reference_id column is currently UUID but stores composite strings like "{aquarium_id}-critical"
-- Changing to TEXT allows pattern matching with LIKE operator

ALTER TABLE public.notification_log 
ALTER COLUMN reference_id TYPE text 
USING reference_id::text;