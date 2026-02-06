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
  timeUntilReset: number | null;
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

  // Use ref to track rate limit state synchronously (avoids race condition)
  const isLimitedRef = useRef(false);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();

    // Calculate synchronously to avoid race condition
    const currentAttempts = attempts.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (currentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...currentAttempts);
      const timeUntilReset = windowMs - (now - oldestAttempt);

      isLimitedRef.current = true;
      setIsRateLimited(true);
      setResetTime(now + timeUntilReset);
      setAttempts(currentAttempts);

      if (onLimitExceeded) {
        onLimitExceeded();
      }

      // Auto-reset after window expires
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isLimitedRef.current = false;
        setIsRateLimited(false);
        setResetTime(null);
        setAttempts([]);
      }, timeUntilReset);

      return false; // Rate limited
    }

    // Not limited - add current attempt
    isLimitedRef.current = false;
    setAttempts([...currentAttempts, now]);
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

  // Calculate time until reset in human-readable format
  const timeUntilReset = resetTime ? Math.max(0, resetTime - Date.now()) : null;

  return {
    isRateLimited,
    attemptsRemaining,
    resetTime,
    timeUntilReset,
    checkRateLimit,
    resetRateLimit,
  };
};
