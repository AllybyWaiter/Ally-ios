import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferralCode } from '@/hooks/useReferralCode';
import { Gift, Clock, CheckCircle2, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export function ReferralRewards() {
  const { rewards, isLoading } = useReferralCode();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const getStatusBadge = (status: string, expiresAt: string) => {
    const expired = isPast(new Date(expiresAt));
    
    if (expired && status === 'pending') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3" />
            Available
          </Badge>
        );
      case 'applied':
        return (
          <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Applied
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'referrer_bonus':
        return 'Referral Bonus';
      case 'referee_bonus':
        return 'Welcome Bonus';
      default:
        return 'Reward';
    }
  };

  const handleRedeem = async (rewardId: string, couponId: string | null) => {
    if (!couponId) {
      toast.error('No coupon available for this reward');
      return;
    }

    setRedeemingId(rewardId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_name: 'plus',
          billing_interval: 'month',
          coupon_id: couponId,
          reward_id: rewardId,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Failed to start checkout:', err);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setRedeemingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Gift className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No rewards yet</p>
          <p className="text-sm text-muted-foreground">
            Share your referral code to earn rewards!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Your Rewards</h3>
      </div>

      {rewards.map((reward) => {
        const isAvailable = reward.status === 'pending' && !isPast(new Date(reward.expires_at));
        
        return (
          <Card key={reward.id} className={isAvailable ? 'border-primary/30' : ''}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {getRewardTypeLabel(reward.reward_type)}
                    </span>
                    {getStatusBadge(reward.status, reward.expires_at)}
                  </div>
                  
                  <p className="text-sm text-primary font-medium">
                    1 Month Plus Free
                  </p>
                  
                  <div className="text-xs text-muted-foreground">
                    {reward.status === 'applied' && reward.applied_at ? (
                      <span>Applied {format(new Date(reward.applied_at), 'MMM d, yyyy')}</span>
                    ) : reward.status === 'pending' ? (
                      <span>
                        Expires {formatDistanceToNow(new Date(reward.expires_at), { addSuffix: true })}
                      </span>
                    ) : (
                      <span>Expired {format(new Date(reward.expires_at), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>

                {isAvailable && (
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(reward.id, reward.stripe_coupon_id)}
                    disabled={redeemingId === reward.id}
                  >
                    {redeemingId === reward.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Redeem'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
