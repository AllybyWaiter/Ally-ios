-- Add streak tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_test_date date;

-- Create function to update streak on water test insert
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  days_since_last_test integer;
BEGIN
  -- Get current profile data
  SELECT current_streak, longest_streak, last_test_date
  INTO profile_record
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Calculate days since last test
  IF profile_record.last_test_date IS NULL THEN
    days_since_last_test := NULL;
  ELSE
    days_since_last_test := CURRENT_DATE - profile_record.last_test_date;
  END IF;
  
  -- Update streak based on days since last test
  IF days_since_last_test IS NULL OR days_since_last_test > 2 THEN
    -- First test or streak broken (more than 1 day grace period)
    UPDATE profiles
    SET 
      current_streak = 1,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), 1),
      last_test_date = CURRENT_DATE
    WHERE user_id = NEW.user_id;
  ELSIF days_since_last_test = 0 THEN
    -- Same day test, just update last_test_date
    UPDATE profiles
    SET last_test_date = CURRENT_DATE
    WHERE user_id = NEW.user_id;
  ELSE
    -- Consecutive day (1 or 2 days), increment streak
    UPDATE profiles
    SET 
      current_streak = COALESCE(current_streak, 0) + 1,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), COALESCE(current_streak, 0) + 1),
      last_test_date = CURRENT_DATE
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on water_tests insert
DROP TRIGGER IF EXISTS on_water_test_insert_update_streak ON water_tests;
CREATE TRIGGER on_water_test_insert_update_streak
  AFTER INSERT ON water_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();