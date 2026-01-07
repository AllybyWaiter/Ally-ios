import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  timeoutMs?: number;
  onTimeout?: () => void;
  onError?: (error: Error) => void;
}

export function useLazyLoad(options: UseLazyLoadOptions = {}) {
  const { timeoutMs = 10000, onTimeout, onError } = options;
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTimedOut(false);
    setIsLoaded(false);

    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsTimedOut(true);
      onTimeout?.();
    }, timeoutMs);

    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [retryNonce, timeoutMs, onTimeout]);

  useEffect(() => {
    if (isLoaded && timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isLoaded]);

  const markLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const markError = useCallback((error?: Error) => {
    setHasError(true);
    if (error) onError?.(error);
  }, [onError]);

  const retry = useCallback(() => {
    setHasError(false);
    setIsTimedOut(false);
    setIsLoaded(false);
    setRetryNonce((n) => n + 1);
  }, []);

  return {
    isLoaded,
    isTimedOut,
    hasError,
    showError: hasError || isTimedOut,
    retryNonce,
    markLoaded,
    markError,
    retry,
  };
}
