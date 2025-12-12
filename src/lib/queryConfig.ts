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
export const queryPresets = {
  /** For aquariums, equipment, livestock - user's core data */
  aquariumData: {
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
} as const;

// Default query client options
export const defaultQueryOptions = {
  queries: {
    staleTime: STALE_TIMES.semiStatic, // Default: 2 minutes
    gcTime: GC_TIMES.semiStatic, // Default: 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
};
