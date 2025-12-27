import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createLogger } from '../_shared/logger.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const logger = createLogger('get-stripe-prices');

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

    logger.info('Fetching Stripe prices');

    // Get all active prices with their products
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 100,
    });

    // Organize prices by plan
    const priceMap: Record<string, { monthly: string; yearly: string }> = {
      basic: { monthly: '', yearly: '' },
      plus: { monthly: '', yearly: '' },
      gold: { monthly: '', yearly: '' },
    };

    for (const price of prices.data) {
      const planKey = price.metadata?.plan_key;
      const interval = price.recurring?.interval;

      if (planKey && priceMap[planKey]) {
        if (interval === 'month') {
          priceMap[planKey].monthly = price.id;
        } else if (interval === 'year') {
          priceMap[planKey].yearly = price.id;
        }
      }
    }

    logger.info('Price IDs retrieved', { priceMap });

    return createSuccessResponse({
      prices: priceMap,
      secretNames: {
        STRIPE_PRICE_BASIC_MONTHLY: priceMap.basic.monthly,
        STRIPE_PRICE_BASIC_YEARLY: priceMap.basic.yearly,
        STRIPE_PRICE_PLUS_MONTHLY: priceMap.plus.monthly,
        STRIPE_PRICE_PLUS_YEARLY: priceMap.plus.yearly,
        STRIPE_PRICE_GOLD_MONTHLY: priceMap.gold.monthly,
        STRIPE_PRICE_GOLD_YEARLY: priceMap.gold.yearly,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch Stripe prices', error);
    return createErrorResponse(error, logger, { status: 500 });
  }
});
