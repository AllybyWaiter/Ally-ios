-- Create system_incidents table for tracking service incidents
CREATE TABLE public.system_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  affected_services TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create incident_updates table for timeline updates
CREATE TABLE public.incident_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.system_incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create scheduled_maintenance table
CREATE TABLE public.scheduled_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  affected_services TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create status_subscribers table for email notifications
CREATE TABLE public.status_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies for system_incidents (public read, admin write)
CREATE POLICY "Anyone can view incidents" ON public.system_incidents
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage incidents" ON public.system_incidents
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for incident_updates (public read, admin write)
CREATE POLICY "Anyone can view incident updates" ON public.incident_updates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage incident updates" ON public.incident_updates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for scheduled_maintenance (public read, admin write)
CREATE POLICY "Anyone can view scheduled maintenance" ON public.scheduled_maintenance
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage scheduled maintenance" ON public.scheduled_maintenance
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for status_subscribers (anyone can subscribe, admins can view)
CREATE POLICY "Anyone can subscribe to status updates" ON public.status_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view subscribers" ON public.status_subscribers
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscribers" ON public.status_subscribers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at triggers
CREATE TRIGGER update_system_incidents_updated_at
  BEFORE UPDATE ON public.system_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_maintenance_updated_at
  BEFORE UPDATE ON public.scheduled_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_system_incidents_status ON public.system_incidents(status);
CREATE INDEX idx_system_incidents_started_at ON public.system_incidents(started_at DESC);
CREATE INDEX idx_incident_updates_incident_id ON public.incident_updates(incident_id);
CREATE INDEX idx_scheduled_maintenance_scheduled_start ON public.scheduled_maintenance(scheduled_start);
CREATE INDEX idx_status_subscribers_email ON public.status_subscribers(email);