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
  const lastVisibilityCheck = useRef<number>(0);

  const checkAndRefreshSession = useCallback(async (isVisibilityChange = false) => {
    try {
      // Create a timeout promise for quick response
      const timeoutPromise = new Promise<{ data: { session: null }, error: null }>((resolve) => {
        setTimeout(() => resolve({ data: { session: null }, error: null }), 
          isVisibilityChange ? VISIBILITY_REFRESH_TIMEOUT : 5000
        );
      });

      const sessionPromise = supabase.auth.getSession();
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]);
      
      if (error) {
        console.error('Session check error:', error);
        addBreadcrumb('Session check failed', 'auth', { error: error.message }, FeatureArea.AUTH);
        return;
      }

      if (!session) {
        // If visibility change and no session, might need to force refresh
        if (isVisibilityChange) {
          console.log('🔵 Session: No session on visibility change, attempting refresh...');
          try {
            await supabase.auth.refreshSession();
          } catch (e) {
            console.log('🔵 Session: Refresh attempt failed (user may be logged out)');
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
        console.log('🔵 Session: Visibility change, refreshing session...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('🔴 Session: Visibility refresh failed:', refreshError.message);
        } else {
          console.log('🟢 Session: Visibility refresh successful');
        }
        return;
      }

      // Refresh session if close to expiry
      if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        console.log('Refreshing session - close to expiry');
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh error:', refreshError);
          addBreadcrumb('Session refresh failed', 'auth', { error: refreshError.message }, FeatureArea.AUTH);
          
          toast({
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
        toast({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${minutesRemaining} minutes. Save your work.`,
        });
      }
    } catch (error) {
      console.error('Session monitor error:', error);
    }
  }, [toast]);

  useEffect(() => {
    // Initial check
    checkAndRefreshSession();

    // Set up interval for periodic checks
    const intervalId = setInterval(() => checkAndRefreshSession(false), SESSION_CHECK_INTERVAL);

    // Listen for visibility changes to check session when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Debounce: only check if more than 1 second since last check
        if (now - lastVisibilityCheck.current > 1000) {
          lastVisibilityCheck.current = now;
          console.log('🔵 Session: App became visible, checking session...');
          checkAndRefreshSession(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndRefreshSession]);
};