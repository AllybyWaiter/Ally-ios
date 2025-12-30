-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_code_format CHECK (code ~ '^ALLY-[A-Z0-9]{6}$')
);

-- Create index for fast code lookups
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view their own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can view all referral codes"
  ON public.referral_codes FOR SELECT
  USING (true);

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz,
  rewarded_at timestamptz,
  CONSTRAINT no_self_referral CHECK (referrer_id != referee_id),
  CONSTRAINT unique_referee UNIQUE (referee_id)
);

-- Create indexes
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they are part of"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Service role can manage all referrals"
  ON public.referrals FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create referral_rewards table
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('referrer_bonus', 'referee_bonus')),
  reward_value text NOT NULL DEFAULT 'plus_1_month',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'expired')),
  stripe_coupon_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days')
);

-- Create indexes
CREATE INDEX idx_referral_rewards_user_id ON public.referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);

-- Enable RLS
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_rewards
CREATE POLICY "Users can view their own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all rewards"
  ON public.referral_rewards FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate random 6 character alphanumeric code
    new_code := 'ALLY-' || upper(substr(md5(random()::text), 1, 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to create referral code for user if not exists
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_code text;
  new_code text;
BEGIN
  -- Check for existing code
  SELECT code INTO existing_code
  FROM referral_codes
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := generate_referral_code();
  
  -- Insert new code
  INSERT INTO referral_codes (user_id, code)
  VALUES (_user_id, new_code);
  
  RETURN new_code;
END;
$$;