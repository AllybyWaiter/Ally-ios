import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  rewardedReferrals: number;
}

interface ReferralReward {
  id: string;
  reward_type: string;
  reward_value: string;
  status: string;
  stripe_coupon_id: string | null;
  created_at: string;
  expires_at: string;
  applied_at: string | null;
}

export function useReferralCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get or create user's referral code
  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // First check if code exists
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existing?.code) {
        return existing.code;
      }

      // Create new code via RPC
      const { data: newCode, error } = await supabase.rpc('get_or_create_referral_code', {
        _user_id: user.id,
      });

      if (error) {
        console.error('Error creating referral code:', error);
        return null;
      }

      return newCode;
    },
    enabled: !!user?.id,
  });

  // Get referral stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async (): Promise<ReferralStats> => {
      if (!user?.id) {
        return { totalReferrals: 0, pendingReferrals: 0, rewardedReferrals: 0 };
      }

      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_id', user.id);

      if (error) {
        console.error('Error fetching referral stats:', error);
        return { totalReferrals: 0, pendingReferrals: 0, rewardedReferrals: 0 };
      }

      return {
        totalReferrals: referrals?.length || 0,
        pendingReferrals: referrals?.filter(r => r.status === 'pending').length || 0,
        rewardedReferrals: referrals?.filter(r => r.status === 'rewarded').length || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Get user's rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['referral-rewards', user?.id],
    queryFn: async (): Promise<ReferralReward[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rewards:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Validate a referral code
  const validateCode = async (code: string, email?: string) => {
    const { data, error } = await supabase.functions.invoke('validate-referral-code', {
      body: { code, referee_email: email },
    });

    if (error) {
      throw new Error(error.message || 'Invalid referral code');
    }

    return data;
  };

  // Create referral on signup
  const createReferral = async (referralCodeId: string, referrerId: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: user.id,
        referral_code_id: referralCodeId,
        status: 'pending',
      });

    if (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  };

  // Generate share URL
  const getShareUrl = () => {
    if (!referralCode) return '';
    return `${window.location.origin}/auth?ref=${referralCode}`;
  };

  // Copy code to clipboard
  const copyCode = async () => {
    if (!referralCode) return;
    
    const success = await copyToClipboard(referralCode);
    if (success) {
      toast.success('Referral code copied!');
    } else {
      toast.error('Failed to copy code');
    }
  };

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    const url = getShareUrl();
    if (!url) return;
    
    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Share link copied!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  return {
    referralCode,
    stats: stats || { totalReferrals: 0, pendingReferrals: 0, rewardedReferrals: 0 },
    rewards: rewards || [],
    isLoading: codeLoading || statsLoading || rewardsLoading,
    validateCode,
    createReferral,
    getShareUrl,
    copyCode,
    copyShareUrl,
  };
}
