-- Add recurrence columns to maintenance_tasks table
ALTER TABLE public.maintenance_tasks 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_interval TEXT, -- 'daily', 'weekly', 'biweekly', 'monthly', 'custom'
ADD COLUMN recurrence_days INTEGER; -- For custom intervals (e.g., every 7 days)

-- Add check constraint for valid recurrence intervals
ALTER TABLE public.maintenance_tasks
ADD CONSTRAINT valid_recurrence_interval 
CHECK (recurrence_interval IS NULL OR recurrence_interval IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom'));

-- Add check constraint for recurrence_days when custom
ALTER TABLE public.maintenance_tasks
ADD CONSTRAINT valid_recurrence_days
CHECK (
  (recurrence_interval != 'custom' OR recurrence_days IS NOT NULL) AND
  (recurrence_days IS NULL OR recurrence_days > 0)
);