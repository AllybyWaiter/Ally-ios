import { useState, useEffect } from 'react';
import { Check, Crown, Sparkles, Zap, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { getPaidPlans } from '@/lib/planConstants';
import { useSearchParams } from 'react-router-dom';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { logger } from '@/lib/logger';

interface PlanSelectionStepProps {
  userId: string;
  onComplete: () => Promise<void> | void;
  onBack: () => void;
  currentPreferences?: {
    units: string;
    theme: string;
    language: string;
  };
}

const PLAN_ICONS = {
  basic: Zap,
  plus: Sparkles,
  gold: Crown,
};

// Build plans from constants
const plans = getPaidPlans().map(({ tier, definition }) => ({
  id: tier,
  name: definition.name,
  icon: PLAN_ICONS[tier as keyof typeof PLAN_ICONS] || Zap,
  monthlyPrice: definition.pricing?.displayMonthly || null,
  yearlyPrice: definition.pricing?.displayYearly || null,
  description: definition.description,
  features: definition.marketingFeatures.slice(0, 4), // Show first 4 features
  popular: tier === 'plus',
}));

export function PlanSelectionStep({ userId, onComplete, onBack, currentPreferences }: PlanSelectionStepProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { isNative, currentOffering, purchase, showPaywall } = useRevenueCat();

  // Handle returning from cancelled checkout
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const onboardingStep = searchParams.get('onboarding_step');
    
    if (checkoutStatus === 'cancelled' && onboardingStep === '6') {
      toast({
        title: t('planSelection.checkoutCancelled', 'Checkout Cancelled'),
        description: t('planSelection.tryAgain', 'You can select a plan or continue with the free tier.'),
      });
    }
  }, [searchParams, toast, t]);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // Save preferences before purchase flow (prevents data loss if user pays during onboarding)
      if (currentPreferences) {
        const { error: prefError } = await supabase
          .from('profiles')
          .update({
            unit_preference: currentPreferences.units,
            theme_preference: currentPreferences.theme,
            language_preference: currentPreferences.language,
          })
          .eq('user_id', userId);

        if (prefError) {
          logger.error('Failed to save preferences:', prefError);
        }
      }

      // Use RevenueCat for native iOS/Android
      if (isNative) {
        let purchased = false;
        if (currentOffering) {
          const packageIdentifier = `${planId}_${isAnnual ? 'yearly' : 'monthly'}`;
          const pkg = currentOffering.availablePackages.find(
            p => p.identifier.toLowerCase() === packageIdentifier ||
                 p.identifier.toLowerCase().includes(planId) &&
                 p.identifier.toLowerCase().includes(isAnnual ? 'year' : 'month')
          );
          if (pkg) {
            purchased = await purchase(pkg);
          } else {
            purchased = await showPaywall();
          }
        } else {
          purchased = await showPaywall();
        }

        if (purchased) {
          toast({
            title: t('planSelection.subscriptionActivated', 'Subscription activated!'),
            description: t('planSelection.welcome', 'Welcome to Ally Pro!'),
          });
        }
        // Complete onboarding regardless of purchase result
        await onComplete();
        return;
      }

      // Web fallback: Use Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_name: planId,
          billing_interval: isAnnual ? 'year' : 'month',
          success_url: `${window.location.origin}/dashboard?subscription=activated`,
          cancel_url: `${window.location.origin}/dashboard?checkout=cancelled`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const checkoutUrl = new URL(data.url);
        if (!checkoutUrl.hostname.endsWith('stripe.com')) {
          throw new Error('Invalid checkout URL');
        }
        window.location.href = data.url;
        return;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: unknown) {
      logger.error('Checkout error:', error);
      toast({
        title: t('planSelection.paymentNotReady', 'Payment setup not ready'),
        description: t('planSelection.startingFree', 'Starting you on the free plan for now.'),
        variant: 'destructive',
      });
      try {
        await onComplete();
      } catch (completeError) {
        logger.error('Failed to complete onboarding:', completeError);
        toast({
          title: t('common.error', 'Error'),
          description: t('onboarding.completeFailed', 'Failed to complete setup. Please try again.'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleStartFree = async () => {
    setIsLoading(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('onboarding.completeFailed', 'Failed to complete setup. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format price - handle missing prices gracefully
  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined || isNaN(price)) {
      return t('planSelection.contactUs', 'Contact us');
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
      <div className="text-center mb-6">
        <Crown className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">{t('planSelection.title', 'Choose Your Plan')}</h2>
        <p className="text-muted-foreground">{t('planSelection.subtitle', 'Start with a 7 day free trial. Cancel anytime.')}</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4" role="radiogroup" aria-label={t('planSelection.billingPeriod', 'Billing period')}>
        <span 
          className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}
          role="radio"
          aria-checked={!isAnnual}
        >
          {t('planSelection.monthly', 'Monthly')}
        </span>
        <Switch 
          checked={isAnnual} 
          onCheckedChange={setIsAnnual}
          aria-label={t('planSelection.toggleBilling', 'Toggle annual billing')}
        />
        <span 
          className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}
          role="radio"
          aria-checked={isAnnual}
        >
          {t('planSelection.annual', 'Annual')}
        </span>
        {isAnnual && (
          <Badge className="bg-primary text-primary-foreground">{t('planSelection.save20', 'Save 20%')}</Badge>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid gap-4" role="radiogroup" aria-label={t('planSelection.selectPlan', 'Select a plan')}>
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
          const formattedPrice = formatPrice(price);
          const isSelected = selectedPlan === plan.id;
          const showPriceFormat = price !== null && !isNaN(price as number);

          return (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isLoading}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${plan.name} - ${formattedPrice}${showPriceFormat ? (isAnnual ? ' per year' : ' per month') : ''}`}
              className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                plan.popular
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${isLoading && isSelected ? 'opacity-75' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground text-xs">
                  {t('planSelection.mostPopular', 'Most Popular')}
                </Badge>
              )}
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-6 h-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-lg">{plan.name}</span>
                    <span className="text-lg font-bold">
                      {formattedPrice}
                      {showPriceFormat && (
                        <span className="text-sm text-muted-foreground font-normal">
                          /{isAnnual ? t('planSelection.yr', 'yr') : t('planSelection.mo', 'mo')}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                {isLoading && isSelected ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-primary">{t('planSelection.processing', 'Processing...')}</span>
                  </div>
                ) : isSelected && !isLoading ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : null}
              </div>
            </button>
          );
        })}

        {/* Business/Enterprise */}
        <div className="p-4 rounded-lg border-2 border-dashed border-border text-center">
          <Building2 className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{t('planSelection.needBusiness', 'Need a Business plan?')}</p>
          <a 
            href="/contact" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-primary hover:underline"
          >
            {t('planSelection.contactSales', 'Contact Sales')} →
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4">
        <Button 
          variant="ghost" 
          onClick={handleStartFree}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          {t('planSelection.startFree', 'Start Free Instead')}
        </Button>
        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline" disabled={isLoading}>
            {t('preferencesOnboarding.back', 'Back')}
          </Button>
          <Button onClick={handleStartFree} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.loading', 'Loading...')}
              </>
            ) : (
              t('planSelection.continueFree', 'Continue Free')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
