import { useState, useEffect } from 'react';

interface OnlineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to detect online/offline status
 * @returns Current online status and whether device was offline
 */
export const useOnlineStatus = (): OnlineStatusReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
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
  }, []);

  return { isOnline, wasOffline };
};
