import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addBreadcrumb, FeatureArea } from '@/lib/sentry';

const SESSION_CHECK_INTERVAL = 60000; // Check every minute
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if less than 5 minutes remaining
const SESSION_WARNING_THRESHOLD = 10 * 60 * 1000; // Warn if less than 10 minutes remaining

export const useSessionMonitor = () => {
  const { toast } = useToast();

  const checkAndRefreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        addBreadcrumb('Session check failed', 'auth', { error: error.message }, FeatureArea.AUTH);
        return;
      }

      if (!session) return;

      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Log session status
      addBreadcrumb(
        'Session status checked',
        'auth',
        { 
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
          expiresAt: new Date(expiresAt).toISOString()
        },
        FeatureArea.AUTH
      );

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
    const intervalId = setInterval(checkAndRefreshSession, SESSION_CHECK_INTERVAL);

    // Listen for visibility changes to check session when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndRefreshSession]);
};
