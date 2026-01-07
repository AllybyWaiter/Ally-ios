-- Fix RLS policies that claim to be service_role only but are actually public

-- Fix customers table: should be service_role only for Stripe webhook management
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;
CREATE POLICY "Service role can manage customers" ON public.customers
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users should be able to view their own customer record
CREATE POLICY "Users can view own customer record" ON public.customers
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix subscriptions table: should be service_role only for Stripe webhook management
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users should be able to view their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix subscription_events: service_role only (webhook processing)
DROP POLICY IF EXISTS "Service role can manage subscription_events" ON public.subscription_events;
CREATE POLICY "Service role can manage subscription_events" ON public.subscription_events
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix referrals: service_role for management, users can view their own
DROP POLICY IF EXISTS "Service role can manage all referrals" ON public.referrals;
CREATE POLICY "Service role can manage all referrals" ON public.referrals
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view referrals they made" ON public.referrals
FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they received" ON public.referrals
FOR SELECT TO authenticated USING (auth.uid() = referee_id);

-- Fix referral_rewards: service_role for management, users can view their own
DROP POLICY IF EXISTS "Service role can manage all rewards" ON public.referral_rewards;
CREATE POLICY "Service role can manage all rewards" ON public.referral_rewards
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own rewards" ON public.referral_rewards
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix referral_codes: users should only see their own codes
DROP POLICY IF EXISTS "Service role can view all referral codes" ON public.referral_codes;
CREATE POLICY "Service role can view all referral codes" ON public.referral_codes
FOR SELECT TO service_role USING (true);

CREATE POLICY "Users can view own referral codes" ON public.referral_codes
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix ai_alerts: service_role only for AI system
DROP POLICY IF EXISTS "Service role can insert ai_alerts" ON public.ai_alerts;
CREATE POLICY "Service role can insert ai_alerts" ON public.ai_alerts
FOR INSERT TO service_role WITH CHECK (true);

-- Fix notification_log: service_role for insert, users can view their own
DROP POLICY IF EXISTS "Service role can insert notification log" ON public.notification_log;
CREATE POLICY "Service role can insert notification log" ON public.notification_log
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Users can view own notifications" ON public.notification_log
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix weather_alerts_notified: service_role only
DROP POLICY IF EXISTS "Service role can manage weather alerts notified" ON public.weather_alerts_notified;
CREATE POLICY "Service role can manage weather alerts notified" ON public.weather_alerts_notified
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix support_tickets INSERT: should require authentication
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets" ON public.support_tickets
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);