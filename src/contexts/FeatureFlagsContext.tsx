/**
 * Feature Flags Context
 * 
 * Provides feature flag state to the entire app with caching and real-time evaluation.
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchFeatureFlags, fetchUserOverrides, FeatureFlag, FeatureFlagOverride } from '@/infrastructure/queries/featureFlags';
import { useAuthContext } from './AuthContext';
import { useProfileContext } from './ProfileContext';
import { usePermissionsContext } from './PermissionsContext';

interface FeatureFlagsContextValue {
  flags: FeatureFlag[];
  overrides: FeatureFlagOverride[];
  isLoading: boolean;
  isEnabled: (flagKey: string) => boolean;
  refetch: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

// Simple hash function for consistent rollout
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const { subscriptionTier } = useProfileContext();
  const { roles } = usePermissionsContext();

  // Fetch all flags
  const { 
    data: flags = [], 
    isLoading: flagsLoading,
    refetch: refetchFlags 
  } = useQuery({
    queryKey: queryKeys.featureFlags.all,
    queryFn: fetchFeatureFlags,
    staleTime: 30000, // 30 seconds
    enabled: !!user,
  });

  // Fetch user-specific overrides
  const { 
    data: overrides = [], 
    isLoading: overridesLoading,
    refetch: refetchOverrides
  } = useQuery({
    queryKey: queryKeys.featureFlags.userOverrides(user?.id ?? ''),
    queryFn: () => fetchUserOverrides(user!.id),
    staleTime: 30000,
    enabled: !!user,
  });

  // Memoized flag evaluation function
  const isEnabled = useMemo(() => {
    return (flagKey: string): boolean => {
      const flag = flags.find(f => f.key === flagKey);
      
      // Flag doesn't exist - default to disabled
      if (!flag) return false;
      
      // Check user override first
      const override = overrides.find(o => o.flag_id === flag.id);
      if (override) return override.enabled;
      
      // Check if flag is globally disabled
      if (!flag.enabled) return false;
      
      // Check role targeting
      if (flag.target_roles && flag.target_roles.length > 0) {
        const hasTargetRole = flag.target_roles.some(role => 
          roles.includes(role as any)
        );
        if (!hasTargetRole) return false;
      }
      
      // Check tier targeting
      if (flag.target_tiers && flag.target_tiers.length > 0) {
        if (!subscriptionTier || !flag.target_tiers.includes(subscriptionTier)) {
          return false;
        }
      }
      
      // Check rollout percentage
      if (flag.rollout_percentage < 100 && user) {
        const hash = hashString(`${flag.key}-${user.id}`);
        const bucket = hash % 100;
        if (bucket >= flag.rollout_percentage) return false;
      }
      
      return true;
    };
  }, [flags, overrides, roles, subscriptionTier, user]);

  const refetch = () => {
    refetchFlags();
    refetchOverrides();
  };

  const value: FeatureFlagsContextValue = {
    flags,
    overrides,
    isLoading: flagsLoading || overridesLoading,
    isEnabled,
    refetch,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlagsContext() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlagsContext must be used within a FeatureFlagsProvider');
  }
  return context;
}
