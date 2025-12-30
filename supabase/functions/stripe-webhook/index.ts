import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createLogger, Logger } from '../_shared/logger.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  const logger = createLogger('stripe-webhook');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_API_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey) {
      logger.error('STRIPE_API_KEY not configured');
      return createErrorResponse('Stripe not configured', logger, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // SECURITY: Always require webhook signature verification
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return createErrorResponse('Webhook secret not configured', logger, { status: 500 });
    }

    if (!signature) {
      logger.error('Missing stripe-signature header');
      return createErrorResponse('Missing signature', logger, { status: 400 });
    }

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      logger.error('Webhook signature verification failed', err);
      return createErrorResponse('Invalid signature', logger, { status: 400 });
    }

    logger.info('Received webhook event', { type: event.type, id: event.id });

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for duplicate event
    const { data: existingEvent } = await supabaseAdmin
      .from('subscription_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      logger.info('Duplicate event, skipping', { eventId: event.id });
      return createSuccessResponse({ received: true, duplicate: true });
    }

    // Store event in audit log
    await supabaseAdmin.from('subscription_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseAdmin, stripe, session, logger);
        // Check for referral and trigger rewards
        await triggerReferralReward(session.metadata?.user_id, logger);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabaseAdmin, stripe, subscription, logger);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseAdmin, subscription, logger);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseAdmin, invoice, logger);
        break;
      }

      default:
        logger.info('Unhandled event type', { type: event.type });
    }

    return createSuccessResponse({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', error);
    return createErrorResponse(error, logger, { status: 500 });
  }
});

// deno-lint-ignore no-explicit-any
async function handleCheckoutCompleted(
  supabase: SupabaseClient<any, any, any>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  logger: Logger
) {
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    logger.warn('No subscription ID in checkout session');
    return;
  }

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadata = subscription.metadata;
  const userId = metadata.user_id;

  if (!userId) {
    logger.error('No user_id in subscription metadata');
    return;
  }

  logger.setUserId(userId);

  const planName = metadata.plan_name || 'basic';
  const billingInterval = metadata.billing_interval || 'month';

  // Upsert subscription record
  const { error: subError } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: subscription.items.data[0]?.price.id || '',
    plan_name: planName,
    billing_interval: billingInterval,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, {
    onConflict: 'stripe_subscription_id',
  });

  if (subError) {
    logger.error('Failed to upsert subscription', subError);
  }

  // Update profile subscription tier
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ subscription_tier: planName })
    .eq('user_id', userId);

  if (profileError) {
    logger.error('Failed to update profile tier', profileError);
  }

  logger.info('Checkout completed', { userId, planName, subscriptionId });
}

// deno-lint-ignore no-explicit-any
async function handleSubscriptionUpdated(
  supabase: SupabaseClient<any, any, any>,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  logger: Logger
) {
  let userId = subscription.metadata.user_id;

  if (!userId) {
    // Try to find user by subscription ID
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!sub) {
      logger.warn('Cannot find user for subscription update', { subscriptionId: subscription.id });
      return;
    }
    userId = sub.user_id;
  }

  const planName = subscription.metadata.plan_name || 'basic';
  const billingInterval = subscription.metadata.billing_interval || 'month';

  // Safely convert timestamps (handle undefined/null cases)
  const periodStart = subscription.current_period_start 
    ? new Date(subscription.current_period_start * 1000).toISOString() 
    : null;
  const periodEnd = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toISOString() 
    : null;

  // Update subscription record
  const updateData: Record<string, unknown> = {
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    plan_name: planName,
    billing_interval: billingInterval,
  };

  // Only add period dates if they're valid
  if (periodStart) updateData.current_period_start = periodStart;
  if (periodEnd) updateData.current_period_end = periodEnd;

  const { error: subError } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    logger.error('Failed to update subscription', subError);
  }

  // Update profile tier based on status
  if (userId && subscription.status === 'active') {
    await supabase
      .from('profiles')
      .update({ subscription_tier: planName })
      .eq('user_id', userId);
  }

  logger.info('Subscription updated', { subscriptionId: subscription.id, status: subscription.status });
}

// deno-lint-ignore no-explicit-any
async function handleSubscriptionDeleted(
  supabase: SupabaseClient<any, any, any>,
  subscription: Stripe.Subscription,
  logger: Logger
) {
  // Find user by subscription ID
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!sub) {
    logger.warn('Cannot find subscription to delete', { subscriptionId: subscription.id });
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  // Set profile back to free tier
  await supabase
    .from('profiles')
    .update({ subscription_tier: 'free' })
    .eq('user_id', sub.user_id);

  logger.info('Subscription deleted', { userId: sub.user_id, subscriptionId: subscription.id });
}

// deno-lint-ignore no-explicit-any
async function handlePaymentFailed(
  supabase: SupabaseClient<any, any, any>,
  invoice: Stripe.Invoice,
  logger: Logger
) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to past_due
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);

  logger.info('Payment failed, subscription marked past_due', { subscriptionId });
}

// Trigger referral reward when a user makes their first payment
async function triggerReferralReward(userId: string | undefined, logger: Logger) {
  if (!userId) return;

  try {
    // Call apply-referral-reward function
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/apply-referral-reward`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ referee_id: userId, trigger: 'checkout_completed' }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.rewarded) {
        logger.info('Referral reward triggered', { userId, referral_id: result.referral_id });
      }
    }
  } catch (error) {
    logger.warn('Failed to trigger referral reward', { userId, error });
    // Don't throw - referral reward failure shouldn't block subscription
  }
}
