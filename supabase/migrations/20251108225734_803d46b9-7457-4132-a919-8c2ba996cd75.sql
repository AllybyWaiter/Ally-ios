-- Create function to enforce custom template limits based on subscription tier
CREATE OR REPLACE FUNCTION public.enforce_template_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier TEXT;
  template_count INT;
  tier_limit INT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles WHERE user_id = NEW.user_id;
  
  -- Count existing templates for this user
  SELECT COUNT(*) INTO template_count
  FROM custom_parameter_templates WHERE user_id = NEW.user_id;
  
  -- Determine limit based on tier
  tier_limit := CASE user_tier
    WHEN 'free' THEN 0
    WHEN 'plus' THEN 10
    WHEN 'gold' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 0  -- Default to most restrictive
  END;
  
  -- Enforce limit
  IF template_count >= tier_limit THEN
    RAISE EXCEPTION 'Template limit reached for % subscription tier. You have % templates and the limit is %.', 
      user_tier, template_count, tier_limit
      USING HINT = 'Upgrade your subscription to create more custom templates';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce template limits on insert
CREATE TRIGGER enforce_template_limit_trigger
  BEFORE INSERT ON public.custom_parameter_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_template_limit();