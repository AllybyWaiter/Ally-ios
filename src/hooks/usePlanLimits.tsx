import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface PlanLimits {
  maxAquariums: number;
  maxTestLogsPerMonth: number | null; // null = unlimited
  hasEquipmentTracking: boolean;
  hasAllyMemory: boolean;
  hasMultiTankManagement: boolean;
  hasExportHistory: boolean;
  hasReasoningModel: boolean; // Ally 1.0 Thinking
  hasAITrendAlerts: boolean; // AI-powered predictive alerts
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxAquariums: 1,
    maxTestLogsPerMonth: 5,
    hasEquipmentTracking: false,
    hasAllyMemory: false,
    hasMultiTankManagement: false,
    hasExportHistory: false,
    hasReasoningModel: false,
    hasAITrendAlerts: false,
  },
  basic: {
    maxAquariums: 1,
    maxTestLogsPerMonth: 10,
    hasEquipmentTracking: false,
    hasAllyMemory: false,
    hasMultiTankManagement: false,
    hasExportHistory: false,
    hasReasoningModel: false,
    hasAITrendAlerts: false,
  },
  plus: {
    maxAquariums: 3,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: false,
    hasExportHistory: false,
    hasReasoningModel: false,
    hasAITrendAlerts: true,
  },
  gold: {
    maxAquariums: 10,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: true,
    hasExportHistory: true,
    hasReasoningModel: true,
    hasAITrendAlerts: true,
  },
  business: {
    maxAquariums: Infinity,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: true,
    hasExportHistory: true,
    hasReasoningModel: true,
    hasAITrendAlerts: true,
  },
  enterprise: {
    maxAquariums: Infinity,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: true,
    hasExportHistory: true,
    hasReasoningModel: true,
    hasAITrendAlerts: true,
  },
};

export function usePlanLimits() {
  const { subscriptionTier, user, loading: authLoading } = useAuth();
  
  // Only resolve tier once auth is complete and subscriptionTier is loaded
  const isLoading = authLoading || (user && subscriptionTier === null);
  const tier = isLoading ? null : (subscriptionTier || 'free');
  const limits = tier ? (PLAN_LIMITS[tier] || PLAN_LIMITS.free) : PLAN_LIMITS.free;

  // Query for monthly test log count
  const { data: monthlyTestCount = 0 } = useQuery({
    queryKey: ['monthly-test-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      
      const { count, error } = await supabase
        .from('water_tests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);
      
      if (error) {
        console.error('Error fetching test count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id && limits.maxTestLogsPerMonth !== null,
  });

  const canCreateAquarium = (currentCount: number): boolean => {
    return currentCount < limits.maxAquariums;
  };

  const getRemainingAquariums = (currentCount: number): number => {
    if (limits.maxAquariums === Infinity) return Infinity;
    return Math.max(0, limits.maxAquariums - currentCount);
  };

  const canLogTest = (): boolean => {
    if (limits.maxTestLogsPerMonth === null) return true;
    return monthlyTestCount < limits.maxTestLogsPerMonth;
  };

  const getRemainingTests = (): number => {
    if (limits.maxTestLogsPerMonth === null) return Infinity;
    return Math.max(0, limits.maxTestLogsPerMonth - monthlyTestCount);
  };

  const getUpgradeSuggestion = (): string | null => {
    if (tier === 'free' || tier === 'basic') return 'plus';
    if (tier === 'plus') return 'gold';
    if (tier === 'gold') return 'business';
    return null;
  };

  return {
    tier,
    limits,
    loading: isLoading,
    canCreateAquarium,
    getRemainingAquariums,
    canLogTest,
    getRemainingTests,
    monthlyTestCount,
    getUpgradeSuggestion,
  };
}
