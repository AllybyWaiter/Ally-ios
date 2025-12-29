import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createLogger } from '../_shared/logger.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/errorHandler.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceConfig {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

const PLANS: Record<string, PriceConfig> = {
  basic: {
    name: 'Basic',
    monthlyPrice: 999, // $9.99 in cents
    yearlyPrice: 9590, // $95.90 in cents (20% off)
    features: ['1 water body', '10 test logs per month', 'AI recommendations', 'Basic smart scheduling'],
  },
  plus: {
    name: 'Plus',
    monthlyPrice: 1499, // $14.99 in cents
    yearlyPrice: 14390, // $143.90 in cents (20% off)
    features: ['3 water bodies', 'Unlimited test logs', 'AI recommendations', 'Ally remembers your setup', 'Equipment tracking'],
  },
  gold: {
    name: 'Gold',
    monthlyPrice: 1999, // $19.99 in cents
    yearlyPrice: 19190, // $191.90 in cents (20% off)
    features: ['10 water bodies', 'Unlimited test logs', 'Multi-tank management', 'Export history', 'Priority AI'],
  },
};

Deno.serve(async (req) => {
  const logger = createLogger('setup-stripe-products');

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

    logger.info('Starting Stripe products setup');

    const createdProducts: Record<string, any> = {};

    for (const [planKey, plan] of Object.entries(PLANS)) {
      logger.info(`Creating product: ${plan.name}`);

      // Create the product
      const product = await stripe.products.create({
        name: `Ally ${plan.name}`,
        description: plan.features.join(', '),
        metadata: {
          plan_key: planKey,
        },
      });

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan_key: planKey,
          billing_interval: 'month',
        },
      });

      // Create yearly price
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice,
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
        metadata: {
          plan_key: planKey,
          billing_interval: 'year',
        },
      });

      createdProducts[planKey] = {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id,
        monthlyAmount: plan.monthlyPrice,
        yearlyAmount: plan.yearlyPrice,
      };

      logger.info(`Created ${plan.name} - Monthly: ${monthlyPrice.id}, Yearly: ${yearlyPrice.id}`);
    }

    logger.info('Stripe products setup complete');

    return createSuccessResponse({
      message: 'Stripe products and prices created successfully',
      products: createdProducts,
      instructions: 'Add these price IDs to your secrets or use them directly in your checkout flow',
    });
  } catch (error) {
    logger.error('Failed to setup Stripe products', error);
    return createErrorResponse(error, logger, { status: 500 });
  }
});
