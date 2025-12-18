-- Add pool volume calculation fields to aquariums table
ALTER TABLE public.aquariums
ADD COLUMN IF NOT EXISTS volume_calculation_method text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS pool_shape text,
ADD COLUMN IF NOT EXISTS pool_dimensions jsonb,
ADD COLUMN IF NOT EXISTS pool_adjustments jsonb,
ADD COLUMN IF NOT EXISTS volume_confidence_range jsonb;

-- Add comment explaining the columns
COMMENT ON COLUMN public.aquariums.volume_calculation_method IS 'manual or calculated';
COMMENT ON COLUMN public.aquariums.pool_shape IS 'round, oval, rectangle, kidney';
COMMENT ON COLUMN public.aquariums.pool_dimensions IS 'Stores measurements: diameter_ft, length_ft, width_ft, single_depth_ft, shallow_depth_ft, deep_depth_ft';
COMMENT ON COLUMN public.aquariums.pool_adjustments IS 'Stores adjustments: water_inches_below_top, has_steps, has_bench';
COMMENT ON COLUMN public.aquariums.volume_confidence_range IS 'Stores: min_gallons, max_gallons, confidence_level';