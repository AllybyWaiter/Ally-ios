-- Create feature_flags table for flag definitions
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_tiers text[] DEFAULT '{}',
  target_roles app_role[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create feature_flag_overrides table for user-specific targeting
CREATE TABLE public.feature_flag_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  enabled boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (flag_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags
CREATE POLICY "Authenticated users can view feature flags"
ON public.feature_flags
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for feature_flag_overrides
CREATE POLICY "Admins can manage overrides"
ON public.feature_flag_overrides
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own overrides"
ON public.feature_flag_overrides
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();