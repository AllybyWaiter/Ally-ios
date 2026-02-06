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
  // Ref mirrors attempts state for synchronous reads in rapid successive calls
  const attemptsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();

    // Read from ref to get the latest value even between renders
    const recentAttempts = attemptsRef.current.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const resetDelay = windowMs - (now - oldestAttempt);

      attemptsRef.current = recentAttempts;
      setAttempts(recentAttempts);
      setIsRateLimited(true);
      setResetTime(now + resetDelay);

      if (onLimitExceeded) {
        onLimitExceeded();
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        attemptsRef.current = [];
        setAttempts([]);
        setIsRateLimited(false);
        setResetTime(null);
      }, resetDelay);

      return false; // Rate limited
    }

    // Not limited - add current attempt
    const newAttempts = [...recentAttempts, now];
    attemptsRef.current = newAttempts;
    setAttempts(newAttempts);
    return true;
  }, [maxAttempts, windowMs, onLimitExceeded]);

  const resetRateLimit = useCallback(() => {
    attemptsRef.current = [];
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
