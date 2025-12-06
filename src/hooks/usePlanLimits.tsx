import { useAuth } from '@/hooks/useAuth';

export interface PlanLimits {
  maxAquariums: number;
  maxTestLogsPerMonth: number | null; // null = unlimited
  hasEquipmentTracking: boolean;
  hasAllyMemory: boolean;
  hasMultiTankManagement: boolean;
  hasExportHistory: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxAquariums: 1,
    maxTestLogsPerMonth: 5,
    hasEquipmentTracking: false,
    hasAllyMemory: false,
    hasMultiTankManagement: false,
    hasExportHistory: false,
  },
  basic: {
    maxAquariums: 1,
    maxTestLogsPerMonth: 10,
    hasEquipmentTracking: false,
    hasAllyMemory: false,
    hasMultiTankManagement: false,
    hasExportHistory: false,
  },
  plus: {
    maxAquariums: 3,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: false,
    hasExportHistory: false,
  },
  gold: {
    maxAquariums: 10,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: true,
    hasExportHistory: true,
  },
  business: {
    maxAquariums: Infinity,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: true,
    hasExportHistory: true,
  },
  enterprise: {
    maxAquariums: Infinity,
    maxTestLogsPerMonth: null,
    hasEquipmentTracking: true,
    hasAllyMemory: true,
    hasMultiTankManagement: true,
    hasExportHistory: true,
  },
};

export function usePlanLimits() {
  const { subscriptionTier } = useAuth();
  
  const tier = subscriptionTier || 'free';
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

  const canCreateAquarium = (currentCount: number): boolean => {
    return currentCount < limits.maxAquariums;
  };

  const getRemainingAquariums = (currentCount: number): number => {
    if (limits.maxAquariums === Infinity) return Infinity;
    return Math.max(0, limits.maxAquariums - currentCount);
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
    canCreateAquarium,
    getRemainingAquariums,
    getUpgradeSuggestion,
  };
}
