-- Expand the task_type CHECK constraint to support pool/spa and AI-suggested categories
-- Previous constraint only allowed: water_change, equipment_maintenance, testing, dosing, custom
-- This adds categories used by the suggest-maintenance-tasks edge function

ALTER TABLE public.maintenance_tasks
  DROP CONSTRAINT IF EXISTS maintenance_tasks_task_type_check;

ALTER TABLE public.maintenance_tasks
  ADD CONSTRAINT maintenance_tasks_task_type_check
  CHECK (task_type IN (
    -- Original aquarium categories
    'water_change',
    'equipment_maintenance',
    'testing',
    'dosing',
    'custom',
    -- Aquarium AI categories
    'cleaning',
    'feeding',
    'other',
    -- Pool/spa categories
    'shock_treatment',
    'chemical_balancing',
    'filter_cleaning',
    'backwash',
    'skimmer_basket',
    'vacuuming',
    'brush_walls',
    'cover_cleaning',
    'salt_cell_cleaning',
    'algae_treatment',
    'drain_refresh',
    'winterize',
    'opening'
  ));
