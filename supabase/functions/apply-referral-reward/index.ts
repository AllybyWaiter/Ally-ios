import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createLogger } from '../_shared/logger.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const logger = createLogger('apply-referral-reward');

  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const stripeKey = Deno.env.get('STRIPE_API_KEY');
    if (!stripeKey) {
      logger.error('STRIPE_API_KEY not configured');
      return createErrorResponse('Stripe not configured', logger, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authentication required', logger, { status: 401 });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return createErrorResponse('Invalid authentication', logger, { status: 401 });
    }

    const { referee_id, trigger } = await req.json();

    if (!referee_id) {
      return createErrorResponse('referee_id is required', logger, { status: 400 });
    }

    // Only allow the referee themselves to trigger their reward
    if (referee_id !== user.id) {
      logger.warn('Unauthorized referral reward attempt', { referee_id, authenticated_user: user.id });
      return createErrorResponse('Unauthorized', logger, { status: 403 });
    }

    logger.info('Processing referral reward', { referee_id, trigger });

    // Find the referral for this referee
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .select('id, referrer_id, status')
      .eq('referee_id', referee_id)
      .eq('status', 'pending')
      .single();

    if (referralError || !referral) {
      logger.info('No pending referral found for user', { referee_id });
      return createSuccessResponse({ message: 'No pending referral', rewarded: false });
    }

    // Claim the referral with an optimistic lock before creating Stripe coupons
    // This prevents double coupon creation from concurrent requests
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('referrals')
      .update({
        status: 'rewarded',
        qualified_at: new Date().toISOString(),
        rewarded_at: new Date().toISOString(),
      })
      .eq('id', referral.id)
      .eq('status', 'pending')
      .select();

    if (updateError) {
      logger.warn('Failed to update referral status', {
        referral_id: referral.id,
        error: updateError.message,
      });
      return createErrorResponse('Failed to process referral', logger, { status: 500 });
    }

    // If no rows were updated, another request already processed this referral
    if (!updateData || updateData.length === 0) {
      logger.info('Referral already processed by concurrent request', { referral_id: referral.id });
      return createSuccessResponse({ message: 'Referral already processed', rewarded: false });
    }

    // Get Plus monthly price for coupon value (100% off for 1 month)
    const plusMonthlyPrice = Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY');

    // Create Stripe coupons for both referrer and referee
    const referrerCoupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      name: 'Referral Reward - 1 Month Plus Free',
      metadata: {
        type: 'referral_reward',
        referral_id: referral.id,
        beneficiary: 'referrer',
      },
    });

    const refereeCoupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      name: 'Welcome Reward - 1 Month Plus Free',
      metadata: {
        type: 'referral_reward',
        referral_id: referral.id,
        beneficiary: 'referee',
      },
    });

    logger.info('Created Stripe coupons', {
      referrerCouponId: referrerCoupon.id,
      refereeCouponId: refereeCoupon.id
    });

    // Create reward records for both users
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Referrer reward
    const { error: referrerRewardError } = await supabaseAdmin
      .from('referral_rewards')
      .insert({
        user_id: referral.referrer_id,
        referral_id: referral.id,
        reward_type: 'referrer_bonus',
        reward_value: 'plus_1_month',
        status: 'pending',
        stripe_coupon_id: referrerCoupon.id,
        expires_at: expiresAt.toISOString(),
      });

    if (referrerRewardError) {
      logger.error('Failed to insert referrer reward', {
        referral_id: referral.id,
        error: referrerRewardError.message,
      });
    }

    // Referee reward (apply immediately if possible)
    const { error: refereeRewardError } = await supabaseAdmin
      .from('referral_rewards')
      .insert({
        user_id: referee_id,
        referral_id: referral.id,
        reward_type: 'referee_bonus',
        reward_value: 'plus_1_month',
        status: 'pending',
        stripe_coupon_id: refereeCoupon.id,
        expires_at: expiresAt.toISOString(),
      });

    if (refereeRewardError) {
      logger.error('Failed to insert referee reward', {
        referral_id: referral.id,
        error: refereeRewardError.message,
      });
    }

    logger.info('Referral rewards created successfully', { 
      referral_id: referral.id,
      referrer_id: referral.referrer_id,
      referee_id 
    });

    return createSuccessResponse({
      rewarded: true,
      referral_id: referral.id,
      referrer_coupon_id: referrerCoupon.id,
      referee_coupon_id: refereeCoupon.id,
    });
  } catch (error) {
    logger.error('Failed to apply referral reward', error);
    return createErrorResponse(error, logger, { status: 500 });
  }
});
