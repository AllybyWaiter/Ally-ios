/**
 * React Query configuration with optimized caching strategies
 * 
 * Data freshness categories:
 * - Static: Reference data that rarely changes (e.g., aquarium types, parameters)
 * - Semi-static: User data that changes occasionally (e.g., aquariums, equipment)
 * - Frequently changing: Data that updates often (e.g., tasks, water tests)
 * - Real-time: Data that needs to be always fresh (e.g., chat messages)
 */

// Stale time configurations (how long data is considered fresh)
export const STALE_TIMES = {
  /** Static reference data - 5 minutes */
  static: 5 * 60 * 1000,
  /** Semi-static user data - 2 minutes */
  semiStatic: 2 * 60 * 1000,
  /** Frequently changing data - 30 seconds */
  frequent: 30 * 1000,
  /** Real-time data - 10 seconds */
  realtime: 10 * 1000,
} as const;

// Garbage collection time configurations (how long to keep unused data in cache)
export const GC_TIMES = {
  /** Static data - 30 minutes */
  static: 30 * 60 * 1000,
  /** Semi-static data - 10 minutes */
  semiStatic: 10 * 60 * 1000,
  /** Frequently changing data - 5 minutes */
  frequent: 5 * 60 * 1000,
  /** Real-time data - 2 minutes */
  realtime: 2 * 60 * 1000,
} as const;

// Query options presets for different data types
// Note: Related data types share the same stale times to prevent refetch cascades
export const queryPresets = {
  /** For aquariums, equipment, livestock, plants - user's core data */
  aquariumData: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For equipment - same as aquariumData to prevent cascade */
  equipment: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For livestock - same as aquariumData to prevent cascade */
  livestock: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For plants - same as aquariumData to prevent cascade */
  plants: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For photos (aquarium, livestock, plant) - same as parent data */
  photos: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For water tests - changes with each test */
  waterTests: {
    staleTime: STALE_TIMES.frequent,
    gcTime: GC_TIMES.frequent,
  },
  /** For maintenance tasks - needs to be relatively fresh */
  tasks: {
    staleTime: STALE_TIMES.frequent,
    gcTime: GC_TIMES.frequent,
  },
  /** For chat conversations - semi-static list */
  chatConversations: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For chat messages - real-time updates */
  chatMessages: {
    staleTime: STALE_TIMES.realtime,
    gcTime: GC_TIMES.realtime,
  },
  /** For admin analytics - semi-static aggregated data */
  analytics: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For blog posts list - static content */
  blogList: {
    staleTime: STALE_TIMES.static,
    gcTime: GC_TIMES.static,
  },
  /** For user profile and settings */
  userProfile: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
  /** For referral data */
  referrals: {
    staleTime: STALE_TIMES.semiStatic,
    gcTime: GC_TIMES.semiStatic,
  },
} as const;

/**
 * Retry configuration with exponential backoff
 * Retries help recover from transient network issues, especially on mobile
 */
export const retryConfig = {
  /** Maximum number of retry attempts */
  maxRetries: 3,
  /** Base delay in milliseconds (doubles with each retry) */
  baseDelayMs: 1000,
  /** Maximum delay between retries */
  maxDelayMs: 30000,
} as const;

/**
 * Calculates retry delay with exponential backoff
 * @param attemptIndex - Zero-based retry attempt index
 * @returns Delay in milliseconds before next retry
 */
export function getRetryDelay(attemptIndex: number): number {
  const delay = retryConfig.baseDelayMs * Math.pow(2, attemptIndex);
  return Math.min(delay, retryConfig.maxDelayMs);
}

/**
 * Determines whether a failed query should be retried
 * Does not retry on 4xx client errors (except 408 Request Timeout and 429 Too Many Requests)
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= retryConfig.maxRetries) return false;

  // Check for HTTP error status codes
  const status = (error as { status?: number })?.status;
  if (status) {
    // Don't retry client errors (except timeout and rate limit)
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
  }

  // Check for Supabase error codes that shouldn't be retried
  const code = (error as { code?: string })?.code;
  if (code) {
    // Don't retry authentication errors
    if (code.startsWith('PGRST') || code === 'invalid_grant' || code === 'unauthorized') {
      return false;
    }
  }

  return true;
}

// Default query client options
export const defaultQueryOptions = {
  queries: {
    staleTime: STALE_TIMES.semiStatic, // Default: 2 minutes
    gcTime: GC_TIMES.semiStatic, // Default: 10 minutes
    retry: shouldRetry,
    retryDelay: getRetryDelay,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
};
