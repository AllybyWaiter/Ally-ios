-- Drop existing constraint and add new one with correct tier values
ALTER TABLE public.profiles DROP CONSTRAINT profiles_subscription_tier_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier = ANY (ARRAY['free'::text, 'basic'::text, 'plus'::text, 'gold'::text, 'business'::text, 'enterprise'::text]));