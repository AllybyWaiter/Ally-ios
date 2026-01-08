import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const MAX_POLL_ATTEMPTS = 15; // 15 attempts * 2 seconds = 30 seconds max
const POLL_INTERVAL = 2000; // 2 seconds

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'polling' | 'success' | 'timeout'>('polling');
  const [attempts, setAttempts] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [onboardingError, setOnboardingError] = useState(false);

  const pollForSubscription = useCallback(async () => {
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .maybeSingle();

    return profile?.subscription_tier ?? null;
  }, [user]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return false;
    
    try {
      // CRITICAL: Complete onboarding if user paid during onboarding flow
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Failed to fetch profile:', fetchError);
        return false;
      }
        
      if (profile && profile.onboarding_completed === false) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Failed to complete onboarding:', updateError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  }, [user]);

  const handleRetryOnboarding = async () => {
    const success = await completeOnboarding();
    if (success) {
      setOnboardingError(false);
      if (refreshProfile) {
        await refreshProfile();
      }
      navigate('/dashboard?subscription=activated', { replace: true });
    } else {
      toast({
        title: 'Still having trouble',
        description: 'Please contact support if this continues.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    let pollTimeout: NodeJS.Timeout;

    const checkSubscription = async () => {
      const tier = await pollForSubscription();
      
      // Check if subscription is now active (not free/null)
      if (tier && tier !== 'free') {
        setSubscriptionTier(tier);
        setStatus('success');
        
        // Track purchase conversion
        if (typeof window !== 'undefined') {
          // GA4 purchase event
          if (window.gtag) {
            window.gtag('event', 'purchase', {
              transaction_id: searchParams.get('session_id') || Date.now().toString(),
              currency: 'USD',
              items: [{ item_name: tier }]
            });
          }
          // Meta Pixel Purchase event
          if (window.fbq) {
            window.fbq('track', 'Purchase', {
              currency: 'USD',
              content_name: tier
            });
          }
        }
        
        // Complete onboarding with error handling
        const onboardingSuccess = await completeOnboarding();
        if (!onboardingSuccess) {
          setOnboardingError(true);
          return; // Don't auto-redirect, show error state
        }
        
        // Refresh the auth context to update everywhere
        if (refreshProfile) {
          await refreshProfile();
        }
        // Redirect to dashboard after brief success display
        setTimeout(() => {
          navigate('/dashboard?subscription=activated', { replace: true });
        }, 2000);
        return;
      }

      // Use functional update to get current attempts value
      setAttempts(prev => {
        const nextAttempts = prev + 1;
        if (nextAttempts >= MAX_POLL_ATTEMPTS) {
          setStatus('timeout');
        }
        return nextAttempts;
      });
      
      // Check if we should stop polling (use attempts + 1 since state hasn't updated yet)
      if (attempts + 1 >= MAX_POLL_ATTEMPTS) {
        return;
      }

      // Continue polling
      pollTimeout = setTimeout(checkSubscription, POLL_INTERVAL);
    };

    checkSubscription();

    return () => {
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [user, navigate, pollForSubscription, attempts, refreshProfile, searchParams, completeOnboarding]);

  const handleContinueAnyway = () => {
    navigate('/dashboard?checkout=pending', { replace: true });
  };

  const handleContactSupport = () => {
    navigate('/contact?subject=subscription-issue');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === 'polling' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
              <h1 className="text-2xl font-bold">Processing Your Subscription</h1>
              <p className="text-muted-foreground">
                Please wait while we activate your account...
              </p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(attempts / MAX_POLL_ATTEMPTS) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This usually takes just a few seconds
              </p>
            </div>
          )}

          {status === 'success' && !onboardingError && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h1 className="text-2xl font-bold">Subscription Activated!</h1>
              <p className="text-muted-foreground">
                Welcome to Ally {subscriptionTier?.charAt(0).toUpperCase()}{subscriptionTier?.slice(1)}! 
                Redirecting to your dashboard...
              </p>
            </div>
          )}

          {status === 'success' && onboardingError && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h1 className="text-2xl font-bold">Subscription Activated!</h1>
              <p className="text-muted-foreground">
                Your subscription is active, but we had trouble completing setup.
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <Button onClick={handleRetryOnboarding} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Setup
                </Button>
                <Button onClick={handleContinueAnyway} variant="outline">
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          )}

          {status === 'timeout' && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-amber-500" />
              <h1 className="text-2xl font-bold">Almost There!</h1>
              <p className="text-muted-foreground">
                Your payment was successful, but your subscription is still being activated. 
                This can sometimes take a minute or two.
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <Button onClick={handleContinueAnyway} variant="default">
                  Continue to Dashboard
                </Button>
                <Button onClick={handleContactSupport} variant="outline">
                  Contact Support
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                If your subscription does not appear within a few minutes, please contact support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
