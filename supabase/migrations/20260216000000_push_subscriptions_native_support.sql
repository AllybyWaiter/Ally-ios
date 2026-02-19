-- Add native push notification support (APNs) alongside existing Web Push
-- platform: 'web' for existing Web Push, 'ios' for native APNs
-- device_token: raw APNs hex token for native subscriptions
-- p256dh and auth become nullable (not needed for native push)

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS device_token TEXT;

-- Make p256dh and auth nullable for native subscriptions
ALTER TABLE public.push_subscriptions
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth DROP NOT NULL;

-- Add constraint: web subscriptions must have p256dh and auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'push_subscriptions_web_keys_check'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_web_keys_check
      CHECK (
        platform != 'web' OR (p256dh IS NOT NULL AND auth IS NOT NULL)
      );
  END IF;
END $$;

-- Add constraint: ios subscriptions must have device_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'push_subscriptions_ios_token_check'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_ios_token_check
      CHECK (
        platform != 'ios' OR device_token IS NOT NULL
      );
  END IF;
END $$;

-- Add an update policy for push_subscriptions (needed for upserting native tokens)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'push_subscriptions'
      AND policyname = 'Users can update their own subscriptions'
  ) THEN
    CREATE POLICY "Users can update their own subscriptions"
    ON public.push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;
