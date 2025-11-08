-- Add subscription and onboarding fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'commercial')),
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create aquariums table
CREATE TABLE public.aquariums (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('freshwater', 'saltwater', 'reef', 'planted')),
  volume_gallons numeric,
  setup_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cycling', 'archived')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on aquariums
ALTER TABLE public.aquariums ENABLE ROW LEVEL SECURITY;

-- RLS policies for aquariums
CREATE POLICY "Users can view their own aquariums"
ON public.aquariums FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own aquariums"
ON public.aquariums FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aquariums"
ON public.aquariums FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own aquariums"
ON public.aquariums FOR DELETE
USING (auth.uid() = user_id);

-- Create water_tests table
CREATE TABLE public.water_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aquarium_id uuid NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date timestamp with time zone NOT NULL DEFAULT now(),
  entry_method text DEFAULT 'manual' CHECK (entry_method IN ('manual', 'photo')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on water_tests
ALTER TABLE public.water_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies for water_tests
CREATE POLICY "Users can view their own water tests"
ON public.water_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water tests"
ON public.water_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water tests"
ON public.water_tests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water tests"
ON public.water_tests FOR DELETE
USING (auth.uid() = user_id);

-- Create test_parameters table
CREATE TABLE public.test_parameters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id uuid NOT NULL REFERENCES public.water_tests(id) ON DELETE CASCADE,
  parameter_name text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  status text CHECK (status IN ('good', 'warning', 'critical')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on test_parameters
ALTER TABLE public.test_parameters ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_parameters (inherit from water_tests)
CREATE POLICY "Users can view their own test parameters"
ON public.test_parameters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.water_tests
    WHERE water_tests.id = test_parameters.test_id
    AND water_tests.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own test parameters"
ON public.test_parameters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.water_tests
    WHERE water_tests.id = test_parameters.test_id
    AND water_tests.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own test parameters"
ON public.test_parameters FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.water_tests
    WHERE water_tests.id = test_parameters.test_id
    AND water_tests.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own test parameters"
ON public.test_parameters FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.water_tests
    WHERE water_tests.id = test_parameters.test_id
    AND water_tests.user_id = auth.uid()
  )
);

-- Create equipment table
CREATE TABLE public.equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aquarium_id uuid NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
  name text NOT NULL,
  equipment_type text NOT NULL,
  brand text,
  model text,
  install_date date,
  maintenance_interval_days integer,
  last_maintenance_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipment (inherit from aquariums)
CREATE POLICY "Users can view their own equipment"
ON public.equipment FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = equipment.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own equipment"
ON public.equipment FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = equipment.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own equipment"
ON public.equipment FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = equipment.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own equipment"
ON public.equipment FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = equipment.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

-- Create maintenance_tasks table
CREATE TABLE public.maintenance_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aquarium_id uuid NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  task_name text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('water_change', 'equipment_maintenance', 'testing', 'dosing', 'custom')),
  due_date date NOT NULL,
  completed_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on maintenance_tasks
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for maintenance_tasks (inherit from aquariums)
CREATE POLICY "Users can view their own maintenance tasks"
ON public.maintenance_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = maintenance_tasks.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own maintenance tasks"
ON public.maintenance_tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = maintenance_tasks.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own maintenance tasks"
ON public.maintenance_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = maintenance_tasks.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own maintenance tasks"
ON public.maintenance_tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.aquariums
    WHERE aquariums.id = maintenance_tasks.aquarium_id
    AND aquariums.user_id = auth.uid()
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_aquariums_updated_at
BEFORE UPDATE ON public.aquariums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_water_tests_updated_at
BEFORE UPDATE ON public.water_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_tasks_updated_at
BEFORE UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_aquariums_user_id ON public.aquariums(user_id);
CREATE INDEX idx_water_tests_aquarium_id ON public.water_tests(aquarium_id);
CREATE INDEX idx_water_tests_user_id ON public.water_tests(user_id);
CREATE INDEX idx_test_parameters_test_id ON public.test_parameters(test_id);
CREATE INDEX idx_equipment_aquarium_id ON public.equipment(aquarium_id);
CREATE INDEX idx_maintenance_tasks_aquarium_id ON public.maintenance_tasks(aquarium_id);
CREATE INDEX idx_maintenance_tasks_due_date ON public.maintenance_tasks(due_date);