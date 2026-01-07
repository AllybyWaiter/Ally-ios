import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  userId: string;
  email: string;
  name: string | null;
  code: string;
  totalReferrals: number;
  pendingReferrals: number;
  qualifiedReferrals: number;
  rewardedReferrals: number;
  totalRewardsValue: number;
}

export interface ReferralProgramStats {
  totalCodes: number;
  totalReferrals: number;
  qualifiedReferrals: number;
  rewardsDistributed: number;
  estimatedValue: number;
}

type TimePeriod = 'all' | '30d' | '7d';

export function useReferralLeaderboard(period: TimePeriod = 'all') {
  return useQuery({
    queryKey: ['referralLeaderboard', period],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Get all referral codes with user info
      const { data: codes, error: codesError } = await supabase
        .from('referral_codes')
        .select('id, user_id, code')
        .eq('is_active', true);

      if (codesError) throw codesError;
      if (!codes?.length) return [];

      // Get user profiles for these codes
      const userIds = [...new Set(codes.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Calculate date filter
      let dateFilter: string | null = null;
      if (period === '30d') {
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (period === '7d') {
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Get referrals for each code
      let referralsQuery = supabase
        .from('referrals')
        .select('referral_code_id, status');

      if (dateFilter) {
        referralsQuery = referralsQuery.gte('created_at', dateFilter);
      }

      const { data: referrals } = await referralsQuery;

      // Get rewards
      let rewardsQuery = supabase
        .from('referral_rewards')
        .select('user_id, reward_type, status');

      if (dateFilter) {
        rewardsQuery = rewardsQuery.gte('created_at', dateFilter);
      }

      const { data: rewards } = await rewardsQuery;

      // Aggregate data per user
      const leaderboard: LeaderboardEntry[] = codes.map(code => {
        const profile = profileMap.get(code.user_id);
        const userReferrals = referrals?.filter(r => r.referral_code_id === code.id) || [];
        const userRewards = rewards?.filter(r => r.user_id === code.user_id) || [];

        const pendingCount = userReferrals.filter(r => r.status === 'pending').length;
        const qualifiedCount = userReferrals.filter(r => r.status === 'qualified').length;
        const rewardedCount = userReferrals.filter(r => r.status === 'rewarded').length;

        // Estimate $14.99 per month reward
        const rewardsValue = userRewards.filter(r => r.status === 'applied').length * 14.99;

        return {
          userId: code.user_id,
          email: profile?.email || 'Unknown',
          name: profile?.name || null,
          code: code.code,
          totalReferrals: userReferrals.length,
          pendingReferrals: pendingCount,
          qualifiedReferrals: qualifiedCount,
          rewardedReferrals: rewardedCount,
          totalRewardsValue: rewardsValue,
        };
      });

      // Sort by total referrals descending, take top 25
      return leaderboard
        .filter(entry => entry.totalReferrals > 0)
        .sort((a, b) => b.totalReferrals - a.totalReferrals)
        .slice(0, 25);
    },
  });
}

export function useReferralProgramStats() {
  return useQuery({
    queryKey: ['referralProgramStats'],
    queryFn: async (): Promise<ReferralProgramStats> => {
      // Count total codes
      const { count: totalCodes } = await supabase
        .from('referral_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Count referrals by status
      const { data: referrals } = await supabase
        .from('referrals')
        .select('status');

      const totalReferrals = referrals?.length || 0;
      const qualifiedReferrals = referrals?.filter(r => r.status === 'qualified' || r.status === 'rewarded').length || 0;

      // Count rewards
      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('status');

      const rewardsDistributed = rewards?.filter(r => r.status === 'applied').length || 0;
      const estimatedValue = rewardsDistributed * 14.99;

      return {
        totalCodes: totalCodes || 0,
        totalReferrals,
        qualifiedReferrals,
        rewardsDistributed,
        estimatedValue,
      };
    },
  });
}
