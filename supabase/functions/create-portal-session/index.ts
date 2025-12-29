import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createLogger } from '../_shared/logger.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const logger = createLogger('create-portal-session');

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
    logger.info('Creating portal session');

    const { return_url } = await req.json();

    // Get customer record
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      logger.info('No customer record found, user has no subscription');
      return new Response(
        JSON.stringify({ error: 'no_subscription', message: 'No active subscription found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: return_url || `${req.headers.get('origin')}/settings`,
    });

    logger.info('Portal session created', { sessionId: session.id });

    return createSuccessResponse({ url: session.url });
  } catch (error) {
    logger.error('Failed to create portal session', error);
    return createErrorResponse(error, logger, { status: 500 });
  }
});
