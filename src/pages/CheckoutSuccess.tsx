import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MAX_POLL_ATTEMPTS = 15; // 15 attempts * 2 seconds = 30 seconds max
const POLL_INTERVAL = 2000; // 2 seconds

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [status, setStatus] = useState<'polling' | 'success' | 'timeout'>('polling');
  const [attempts, setAttempts] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  const pollForSubscription = useCallback(async () => {
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    return profile?.subscription_tier;
  }, [user]);

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

      setAttempts(prev => prev + 1);

      if (attempts >= MAX_POLL_ATTEMPTS) {
        setStatus('timeout');
        return;
      }

      // Continue polling
      pollTimeout = setTimeout(checkSubscription, POLL_INTERVAL);
    };

    checkSubscription();

    return () => {
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [user, navigate, pollForSubscription, attempts, refreshProfile]);

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

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h1 className="text-2xl font-bold">Subscription Activated!</h1>
              <p className="text-muted-foreground">
                Welcome to Ally {subscriptionTier?.charAt(0).toUpperCase()}{subscriptionTier?.slice(1)}! 
                Redirecting to your dashboard...
              </p>
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
