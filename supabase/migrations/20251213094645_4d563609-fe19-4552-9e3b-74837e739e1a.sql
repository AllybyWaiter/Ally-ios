-- Create water_test_alerts table for trend detection alerts
CREATE TABLE public.water_test_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'rising', 'falling', 'unstable', 'approaching_threshold'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  details JSONB, -- trend data, values, percentages
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_water_test_alerts_user_id ON public.water_test_alerts(user_id);
CREATE INDEX idx_water_test_alerts_aquarium_id ON public.water_test_alerts(aquarium_id);
CREATE INDEX idx_water_test_alerts_active ON public.water_test_alerts(user_id, is_dismissed) WHERE is_dismissed = FALSE;

-- Enable Row Level Security
ALTER TABLE public.water_test_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own alerts"
ON public.water_test_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.water_test_alerts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
ON public.water_test_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can insert alerts (from edge function)
CREATE POLICY "Service role can insert alerts"
ON public.water_test_alerts
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_water_test_alerts_updated_at
BEFORE UPDATE ON public.water_test_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();