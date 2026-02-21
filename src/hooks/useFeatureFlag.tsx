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

export const RELIABILITY_FEATURE_FLAGS = {
  WEATHER_EDGE_STATE_POLISH: 'weather_edge_state_polish',
  WEATHER_META_CONTRACT: 'weather_meta_contract',
  WEATHER_GLOBAL_ALERT_PARITY: 'weather_global_alert_parity',
  DISTRIBUTED_RATE_LIMIT: 'distributed_rate_limit',
  CHAT_STREAM_RETRY_BACKOFF: 'chat_stream_retry_backoff',
  CHAT_STREAM_META_EVENT: 'chat_stream_meta_event',
  LOAD_TEST_GATE_ENFORCEMENT: 'load_test_gate_enforcement',
} as const;

export type ReliabilityFeatureFlag = typeof RELIABILITY_FEATURE_FLAGS[keyof typeof RELIABILITY_FEATURE_FLAGS];

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

export function useReliabilityFeatureFlag(flagKey: ReliabilityFeatureFlag): UseFeatureFlagResult {
  return useFeatureFlag(flagKey);
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
