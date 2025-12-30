import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createLogger } from '../_shared/logger.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stripe price IDs - these will be created in Stripe dashboard
const PRICE_IDS = {
  basic: {
    month: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || '',
    year: Deno.env.get('STRIPE_PRICE_BASIC_YEARLY') || '',
  },
  plus: {
    month: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY') || '',
    year: Deno.env.get('STRIPE_PRICE_PLUS_YEARLY') || '',
  },
  gold: {
    month: Deno.env.get('STRIPE_PRICE_GOLD_MONTHLY') || '',
    year: Deno.env.get('STRIPE_PRICE_GOLD_YEARLY') || '',
  },
};

Deno.serve(async (req) => {
  const logger = createLogger('create-checkout-session');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('No authorization header', logger, { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error('User not authenticated', userError);
      return createErrorResponse('User not authenticated', logger, { status: 401 });
    }

    logger.setUserId(user.id);
    logger.info('Creating checkout session');

    const { plan_name, billing_interval, success_url, cancel_url, coupon_id, reward_id } = await req.json();

    // Validate inputs
    if (!plan_name || !['basic', 'plus', 'gold'].includes(plan_name)) {
      return createErrorResponse('Invalid plan name', logger, { status: 400 });
    }
    if (!billing_interval || !['month', 'year'].includes(billing_interval)) {
      return createErrorResponse('Invalid billing interval', logger, { status: 400 });
    }

    const priceId = PRICE_IDS[plan_name as keyof typeof PRICE_IDS]?.[billing_interval as 'month' | 'year'];
    if (!priceId) {
      logger.error('Price ID not found', { plan_name, billing_interval });
      return createErrorResponse('Stripe prices not configured. Please contact support.', logger, { status: 500 });
    }

    // Use service role to manage customers table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if customer already exists
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let stripeCustomerId: string;

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
      logger.info('Using existing Stripe customer', { stripeCustomerId });
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Store in customers table
      const { error: insertError } = await supabaseAdmin
        .from('customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
        });

      if (insertError) {
        logger.error('Failed to store customer', insertError);
        // Don't fail - customer was created in Stripe
      }

      logger.info('Created new Stripe customer', { stripeCustomerId });
    }

    // Build session options
    const sessionOptions: Record<string, unknown> = {
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${req.headers.get('origin')}/dashboard?checkout=success`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/dashboard?checkout=cancelled`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_name,
          billing_interval,
        },
      },
      metadata: {
        user_id: user.id,
        reward_id: reward_id || '',
      },
    };

    // Apply coupon if provided
    if (coupon_id) {
      sessionOptions.discounts = [{ coupon: coupon_id }];
      logger.info('Applying coupon to checkout', { coupon_id });
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    logger.info('Checkout session created', { sessionId: session.id });

    return createSuccessResponse({ url: session.url });
  } catch (error) {
    logger.error('Failed to create checkout session', error);
    return createErrorResponse(error, logger, { status: 500 });
  }
});
