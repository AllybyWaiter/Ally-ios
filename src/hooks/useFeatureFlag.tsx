/**
 * useFeatureFlag Hook
 * 
 * Simple hook for checking if a feature flag is enabled.
 * 
 * Usage:
 * const { enabled, loading } = useFeatureFlag('new_dashboard');
 * if (enabled) { ... }
 */

import { useFeatureFlagsContext } from '@/contexts/FeatureFlagsContext';

interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
}

export function useFeatureFlag(flagKey: string): UseFeatureFlagResult {
  const { isEnabled, isLoading } = useFeatureFlagsContext();
  
  return {
    enabled: isEnabled(flagKey),
    loading: isLoading,
  };
}

/**
 * useMultipleFeatureFlags Hook
 * 
 * Check multiple feature flags at once.
 * 
 * Usage:
 * const { flags, loading } = useMultipleFeatureFlags(['feature_a', 'feature_b']);
 * if (flags.feature_a) { ... }
 */
interface UseMultipleFlagsResult {
  flags: Record<string, boolean>;
  loading: boolean;
}

export function useMultipleFeatureFlags(flagKeys: string[]): UseMultipleFlagsResult {
  const { isEnabled, isLoading } = useFeatureFlagsContext();
  
  const flags = flagKeys.reduce((acc, key) => {
    acc[key] = isEnabled(key);
    return acc;
  }, {} as Record<string, boolean>);
  
  return {
    flags,
    loading: isLoading,
  };
}
