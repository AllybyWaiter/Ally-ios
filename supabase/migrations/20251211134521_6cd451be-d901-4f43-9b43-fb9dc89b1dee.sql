-- Create photo_analysis_corrections table to track when users correct AI-detected values
CREATE TABLE public.photo_analysis_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  water_test_id UUID REFERENCES public.water_tests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  parameter_name TEXT NOT NULL,
  ai_detected_value NUMERIC NOT NULL,
  ai_confidence NUMERIC,
  user_corrected_value NUMERIC NOT NULL,
  correction_delta NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.photo_analysis_corrections ENABLE ROW LEVEL SECURITY;

-- Users can create their own corrections
CREATE POLICY "Users can create their own corrections"
ON public.photo_analysis_corrections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own corrections
CREATE POLICY "Users can view their own corrections"
ON public.photo_analysis_corrections
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all corrections for analysis
CREATE POLICY "Admins can view all corrections"
ON public.photo_analysis_corrections
FOR SELECT
USING (has_role(auth.uid(), 'admin'));