-- Set Gold tier for admin/CEO account
-- This ensures full access to all premium features for testing and administration

UPDATE public.profiles
SET subscription_tier = 'gold'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'stephensjacob3@gmail.com'
);
