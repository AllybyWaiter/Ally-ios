import { useState } from 'react';
import { Check, Crown, Sparkles, Zap, Building2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { PLAN_DEFINITIONS, getPaidPlans } from '@/lib/planConstants';
import { useRevenueCat } from '@/hooks/useRevenueCat';

// Currency formatter for locale-aware pricing
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: string;
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
  monthlyPrice: definition.pricing?.displayMonthly || 0,
  yearlyPrice: definition.pricing?.displayYearly || 0,
  description: definition.description,
  features: definition.marketingFeatures.slice(0, 4), // Show first 4 features
  popular: tier === 'plus',
}));

function PlanContent({ currentTier, onClose }: { currentTier?: string; onClose: () => void }) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // RevenueCat for native iOS/Android purchases
  const { isNative, currentOffering, purchase, showPaywall, restore } = useRevenueCat();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    if (!isNative) return;

    setIsRestoring(true);
    try {
      const restored = await restore();
      if (restored) {
        toast({
          title: 'Purchases restored!',
          description: 'Your subscription has been restored successfully.',
        });
        onClose();
      } else {
        toast({
          title: 'No purchases found',
          description: 'No previous purchases were found to restore.',
        });
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: 'Restore failed',
        description: 'Unable to restore purchases. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    // Don't allow selecting current plan
    if (planId === currentTier?.toLowerCase()) {
      toast({
        title: 'Already on this plan',
        description: 'You are already subscribed to this plan.',
      });
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    // Use RevenueCat for native iOS/Android
    if (isNative) {
      try {
        if (currentOffering) {
          // Find the matching package based on plan tier and billing period
          // Package identifiers are like: basic_monthly, plus_yearly, etc.
          const packageIdentifier = `${planId}_${isAnnual ? 'yearly' : 'monthly'}`;
          const pkg = currentOffering.availablePackages.find(
            p => p.identifier.toLowerCase() === packageIdentifier ||
                 p.identifier.toLowerCase().includes(planId) &&
                 p.identifier.toLowerCase().includes(isAnnual ? 'year' : 'month')
          );

          if (pkg) {
            const success = await purchase(pkg);
            if (success) {
              toast({
                title: 'Subscription activated!',
                description: `Welcome to Ally ${planId.charAt(0).toUpperCase() + planId.slice(1)}!`,
              });
              onClose();
            }
          } else {
            // Fallback: show the RevenueCat paywall
            const purchased = await showPaywall();
            if (purchased) {
              toast({
                title: 'Subscription activated!',
                description: 'Welcome to Ally Pro!',
              });
              onClose();
            }
          }
        } else {
          // No offerings available, show paywall as fallback
          const purchased = await showPaywall();
          if (purchased) {
            toast({
              title: 'Subscription activated!',
              description: 'Welcome to Ally Pro!',
            });
            onClose();
          }
        }
      } catch (error) {
        console.error('Purchase error:', error);
        if ((error as Error).message !== 'Purchase cancelled') {
          toast({
            title: 'Unable to complete purchase',
            description: 'Please try again later.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
        setSelectedPlan(null);
      }
      return;
    }

    // Web fallback: Use Stripe
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_name: planId,
          billing_interval: isAnnual ? 'year' : 'month',
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/settings?checkout=cancelled`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toast({
        title: 'Unable to start checkout',
        description: 'Please try again later or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 py-2">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
        <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Annual
        </span>
        {isAnnual && (
          <Badge className="bg-primary text-primary-foreground">Save 20%</Badge>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid gap-3 max-h-[50vh] overflow-y-auto px-1">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
          const isSelected = selectedPlan === plan.id;
          const isCurrentPlan = plan.id === currentTier?.toLowerCase();

          return (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isLoading || isCurrentPlan}
              className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                isCurrentPlan
                  ? 'border-muted bg-muted/50 opacity-60 cursor-not-allowed'
                  : plan.popular
                  ? 'border-primary bg-primary/5 hover:bg-primary/10'
                  : 'border-border hover:border-primary/50'
              } ${isLoading && isSelected ? 'opacity-75' : ''}`}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-2 right-4 bg-muted text-muted-foreground text-xs">
                  Current Plan
                </Badge>
              )}
              {plan.popular && !isCurrentPlan && (
                <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground text-xs">
                  Most Popular
                </Badge>
              )}
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${plan.popular && !isCurrentPlan ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-6 h-6 ${plan.popular && !isCurrentPlan ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-lg">{plan.name}</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(price)}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{isAnnual ? 'yr' : 'mo'}
                      </span>
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
                {isLoading && isSelected && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                )}
              </div>
            </button>
          );
        })}

        {/* Business/Enterprise */}
        <div className="p-4 rounded-lg border-2 border-dashed border-border text-center">
          <Building2 className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Need a Business plan?</p>
          <a href="/contact" className="text-sm text-primary hover:underline">
            Contact Sales →
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t">
        <a
          href="/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View full feature comparison <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-xs text-muted-foreground text-center">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
        {isNative && (
          <button
            onClick={handleRestorePurchases}
            disabled={isRestoring}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {isRestoring ? 'Restoring...' : 'Restore Purchases'}
          </button>
        )}
      </div>
    </div>
  );
}

export function UpgradePlanDialog({ open, onOpenChange, currentTier }: UpgradePlanDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Upgrade Your Plan
            </DrawerTitle>
            <DrawerDescription>
              Choose a plan that fits your needs
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <PlanContent currentTier={currentTier} onClose={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose a plan that fits your needs
          </DialogDescription>
        </DialogHeader>
        <PlanContent currentTier={currentTier} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
