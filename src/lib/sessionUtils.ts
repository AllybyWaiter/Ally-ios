/**
 * Session Utilities
 *
 * Centralized session management helpers for iOS PWA compatibility.
 * iOS PWAs have known issues with session persistence that require
 * proactive session refresh before data operations.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Ensures the Supabase session is fresh before performing data operations.
 *
 * This is critical for iOS PWA mode where sessions can become stale or
 * missing after the app is backgrounded. Call this before any authenticated
 * Supabase operation to prevent 401 errors.
 *
 * The function checks if a session exists and refreshes if:
 * - No session is present (PWA was backgrounded)
 * - Session is about to expire (within 60 seconds)
 *
 * @returns Promise<void> - Resolves when session is confirmed fresh
 * @throws Error if session refresh fails after session was missing
 */
export async function ensureFreshSession(): Promise<void> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.warn('[Session] Error getting session:', sessionError.message);
      // Attempt refresh even on error
      await supabase.auth.refreshSession();
      return;
    }

    if (!sessionData.session) {
      // No session - try to refresh (iOS PWA may have lost it)
      logger.debug('[Session] No session found, attempting refresh');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        logger.debug('[Session] Refresh failed - user may need to re-authenticate');
        // Don't throw - let the actual operation fail with proper auth error
      }
      return;
    }

    // Check if session is about to expire (within 60 seconds)
    const expiresAt = sessionData.session.expires_at;
    if (expiresAt) {
      const expiresAtMs = expiresAt * 1000;
      const now = Date.now();
      const bufferMs = 60 * 1000; // 60 second buffer

      if (expiresAtMs - now < bufferMs) {
        logger.debug('[Session] Session expiring soon, refreshing proactively');
        await supabase.auth.refreshSession();
      }
    }
  } catch (error) {
    // Log but don't throw - let the actual operation handle auth errors
    logger.warn('[Session] Unexpected error in ensureFreshSession:', error);
  }
}

/**
 * Checks if the current environment is an iOS PWA
 * Useful for conditionally applying iOS-specific fixes
 */
export function isIOSPWA(): boolean {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    navigatorWithStandalone.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/**
 * Gets the current session without refreshing
 * Use this for read-only checks where you don't need a fresh session
 */
export async function getSession() {
  return supabase.auth.getSession();
}

/**
 * Gets the current user from the session
 * Returns null if no session exists
 */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}
