import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface OnlineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to detect online/offline status
 * @returns Current online status and whether device was offline
 */
export const useOnlineStatus = (): OnlineStatusReturn => {
  const isNative = Capacitor.isNativePlatform();
  const [isOnline, setIsOnline] = useState(isNative ? true : navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // navigator.onLine is unreliable in WKWebView; avoid false offline banners on native.
    if (isNative) {
      setIsOnline(true);
      setWasOffline(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);

      // Clear any existing timeout before creating a new one
      if (timeoutId) clearTimeout(timeoutId);

      // Reset wasOffline after 5 seconds
      timeoutId = setTimeout(() => {
        setWasOffline(false);
      }, 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isNative]);

  return { isOnline, wasOffline };
};
