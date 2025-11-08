-- Add tags and photo_url to water_tests table
ALTER TABLE public.water_tests
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS confidence text DEFAULT 'manual';

-- Add index for faster queries on test_date
CREATE INDEX IF NOT EXISTS idx_water_tests_test_date ON public.water_tests(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_water_tests_aquarium_id ON public.water_tests(aquarium_id);

-- Add index for test_parameters for faster lookups
CREATE INDEX IF NOT EXISTS idx_test_parameters_test_id ON public.test_parameters(test_id);
CREATE INDEX IF NOT EXISTS idx_test_parameters_name ON public.test_parameters(parameter_name);