import { useState } from 'react';
import { Check, Crown, Sparkles, Zap, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlanSelectionStepProps {
  userId: string;
  onComplete: () => void;
  onBack: () => void;
}

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Zap,
    monthlyPrice: 9.99,
    yearlyPrice: 95.90,
    description: 'Perfect for single tank owners',
    features: ['1 aquatic space', '10 test logs/month', 'AI recommendations'],
    popular: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    icon: Sparkles,
    monthlyPrice: 14.99,
    yearlyPrice: 143.90,
    description: 'Most popular for hobbyists',
    features: ['3 aquatic spaces', 'Unlimited test logs', 'Ally remembers your setup', 'Equipment tracking'],
    popular: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: Crown,
    monthlyPrice: 19.99,
    yearlyPrice: 191.90,
    description: 'For serious aquarists',
    features: ['10 aquatic spaces', 'Multi-tank management', 'Export history', 'Priority AI'],
    popular: false,
  },
];

export function PlanSelectionStep({ userId, onComplete, onBack }: PlanSelectionStepProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_name: planId,
          billing_interval: isAnnual ? 'year' : 'month',
          success_url: `${window.location.origin}/dashboard?checkout=success`,
          cancel_url: `${window.location.origin}/dashboard?checkout=cancelled`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Payment setup not ready',
        description: 'Stripe is being configured. Starting you on the free plan for now.',
        variant: 'destructive',
      });
      // Continue to dashboard on free plan
      onComplete();
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleStartFree = () => {
    onComplete();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
      <div className="text-center mb-6">
        <Crown className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">Start with a 7-day free trial. Cancel anytime.</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
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
      <div className="grid gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
          const isSelected = selectedPlan === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isLoading}
              className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                plan.popular
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${isLoading && isSelected ? 'opacity-75' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground text-xs">
                  Most Popular
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
                      ${price.toFixed(2)}
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

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4">
        <Button 
          variant="ghost" 
          onClick={handleStartFree}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          Start Free Instead
        </Button>
        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline" disabled={isLoading}>
            Back
          </Button>
          <Button onClick={handleStartFree} disabled={isLoading}>
            Continue Free
          </Button>
        </div>
      </div>
    </div>
  );
}
