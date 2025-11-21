import { useState, useCallback, useRef } from 'react';

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  onLimitExceeded?: () => void;
}

interface RateLimitResult {
  isRateLimited: boolean;
  attemptsRemaining: number;
  resetTime: number | null;
  checkRateLimit: () => boolean;
  resetRateLimit: () => void;
}

/**
 * Custom hook for client-side rate limiting
 * @param options - Configuration for rate limiting
 * @returns Rate limit state and control functions
 */
export const useRateLimit = ({
  maxAttempts,
  windowMs,
  onLimitExceeded,
}: RateLimitOptions): RateLimitResult => {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Remove attempts outside the current window
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const timeUntilReset = windowMs - (now - oldestAttempt);
      
      setIsRateLimited(true);
      setResetTime(now + timeUntilReset);
      
      if (onLimitExceeded) {
        onLimitExceeded();
      }

      // Auto-reset after window expires
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsRateLimited(false);
        setResetTime(null);
        setAttempts([]);
      }, timeUntilReset);

      return false;
    }

    // Add current attempt
    setAttempts([...recentAttempts, now]);
    return true;
  }, [attempts, maxAttempts, windowMs, onLimitExceeded]);

  const resetRateLimit = useCallback(() => {
    setAttempts([]);
    setIsRateLimited(false);
    setResetTime(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const attemptsRemaining = Math.max(
    0,
    maxAttempts - attempts.filter((t) => Date.now() - t < windowMs).length
  );

  return {
    isRateLimited,
    attemptsRemaining,
    resetTime,
    checkRateLimit,
    resetRateLimit,
  };
};
