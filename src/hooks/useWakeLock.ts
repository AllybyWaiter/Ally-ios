import { useRef, useState, useCallback, useEffect } from 'react';

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const isSupported = 'wakeLock' in navigator;

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);

      sentinelRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch (err) {
      console.error('Wake Lock request failed:', err);
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        console.error('Wake Lock release failed:', err);
      }
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Re-acquire on visibility change (standard pattern for wake lock)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sentinelRef.current !== null && !isActive) {
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [request, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, []);

  return { isSupported, isActive, request, release };
}
