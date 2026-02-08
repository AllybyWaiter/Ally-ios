import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addBreadcrumb, FeatureArea } from '@/lib/sentry';

const SESSION_CHECK_INTERVAL = 60000; // Check every minute
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if less than 5 minutes remaining
const SESSION_WARNING_THRESHOLD = 10 * 60 * 1000; // Warn if less than 10 minutes remaining
const VISIBILITY_REFRESH_TIMEOUT = 2000; // Quick timeout for visibility change refresh

export const useSessionMonitor = () => {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const _lastVisibilityCheck = useRef<number>(0);
  const isCheckingRef = useRef<boolean>(false);
  // Queue a pending check if one is requested during an ongoing check
  const pendingCheckRef = useRef<boolean>(false);
  const pendingVisibilityRef = useRef<boolean>(false);

  // Keep toast ref current without causing callback recreation
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const checkAndRefreshSession = useCallback(async (isVisibilityChange = false) => {
    // If already checking, queue a pending check instead of dropping
    if (isCheckingRef.current) {
      pendingCheckRef.current = true;
      // Preserve the visibility change flag if any queued check was a visibility change
      if (isVisibilityChange) pendingVisibilityRef.current = true;
      return;
    }
    isCheckingRef.current = true;
    
    try {
      // Create a timeout promise that rejects so we can distinguish it from a real null session
      const timeoutMs = isVisibilityChange ? VISIBILITY_REFRESH_TIMEOUT : 5000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session check timed out')), timeoutMs);
      });

      const sessionPromise = supabase.auth.getSession();

      let session;
      let error;
      try {
        ({ data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]));
      } catch (_raceError) {
        // Timeout fired before getSession resolved — skip logout logic
        addBreadcrumb('Session check timed out', 'auth', { timeoutMs }, FeatureArea.AUTH);
        return;
      }

      if (error) {
        console.error('Session check error:', error);
        addBreadcrumb('Session check failed', 'auth', { error: error.message }, FeatureArea.AUTH);
        return;
      }

      if (!session) {
        // If visibility change and no session, might need to force refresh
        if (isVisibilityChange) {
          try {
            await supabase.auth.refreshSession();
          } catch {
            // User may be logged out
          }
        }
        return;
      }

      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      addBreadcrumb(
        'Session status checked',
        'auth',
        { 
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
          expiresAt: new Date(expiresAt).toISOString(),
          isVisibilityChange
        },
        FeatureArea.AUTH
      );

      // On visibility change, always try to refresh if session exists
      if (isVisibilityChange) {
        await supabase.auth.refreshSession();
        return;
      }

      // Refresh session if close to expiry
      if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh error:', refreshError);
          addBreadcrumb('Session refresh failed', 'auth', { error: refreshError.message }, FeatureArea.AUTH);
          
          toastRef.current({
            title: "Session Expired",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
        } else {
          addBreadcrumb('Session refreshed successfully', 'auth', {}, FeatureArea.AUTH);
        }
      }
      // Show warning if getting close to expiry
      else if (timeUntilExpiry < SESSION_WARNING_THRESHOLD && timeUntilExpiry > SESSION_REFRESH_THRESHOLD) {
        const minutesRemaining = Math.round(timeUntilExpiry / 60000);
        toastRef.current({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${minutesRemaining} minutes. Save your work.`,
        });
      }
    } catch (error) {
      console.error('Session monitor error:', error);
    } finally {
      isCheckingRef.current = false;

      // Process any pending check that was queued during this check
      if (pendingCheckRef.current) {
        pendingCheckRef.current = false;
        const wasVisibilityChange = pendingVisibilityRef.current;
        pendingVisibilityRef.current = false;
        // Use setTimeout to avoid synchronous recursion; skip if a new check already started
        setTimeout(() => {
          if (!isCheckingRef.current) {
            checkAndRefreshSession(wasVisibilityChange);
          }
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkAndRefreshSession();

    // Set up interval for periodic checks only
    // NOTE: Visibility change handling is now consolidated in useAuth.tsx to prevent race conditions
    const intervalId = setInterval(() => checkAndRefreshSession(false), SESSION_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkAndRefreshSession]);
};