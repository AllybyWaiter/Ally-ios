import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface LazyLoadWithTimeoutProps {
  /** 
   * Children can be a ReactNode (auto-signals ready on mount) 
   * or a render function receiving onReady callback for manual signaling
   */
  children: React.ReactNode | ((onReady: () => void) => React.ReactNode);
  fallback?: React.ReactNode;
  timeoutMs?: number;
  errorTitle?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

// Wrapper to signal successful load on mount (for simple lazy components)
function LoadedCallback({
  children,
  onLoad,
}: {
  children: React.ReactNode;
  onLoad: () => void;
}) {
  useEffect(() => {
    onLoad();
  }, [onLoad]);
  return <>{children}</>;
}

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function LazyLoadWithTimeout({
  children,
  fallback,
  timeoutMs = 10000,
  errorTitle = 'Unable to load',
  icon,
  onRetry,
  onError,
  onTimeout,
}: LazyLoadWithTimeoutProps) {
  const [hasError, setHasError] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTimedOut(false);
    setIsLoaded(false);

    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsTimedOut(true);
      onTimeout?.();
    }, timeoutMs);

    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [retryNonce, timeoutMs, onTimeout]);

  useEffect(() => {
    if (isLoaded && timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isLoaded]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
    setIsTimedOut(false);
    setIsLoaded(false);
    setRetryNonce((n) => n + 1);
    onRetry?.();
  }, [onRetry]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      logger.error('[LazyLoadWithTimeout] Caught lazy component error:', error);
      setErrorMessage(error?.message || String(error));
      setHasError(true);
      onError?.(error);
    },
    [onError]
  );

  if (hasError || isTimedOut) {
    return (
      <Card className="glass-card">
        {icon && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {icon}
              {errorTitle.split(' ')[0]}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <p>{errorTitle}</p>
            {hasError && errorMessage && (
              <p className="max-w-[32rem] text-center text-xs text-muted-foreground/80">
                {errorMessage}
              </p>
            )}
            <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultFallback = (
    <Card className="glass-card">
      <CardContent className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </CardContent>
    </Card>
  );

  // Determine if children is a render function or ReactNode
  const isRenderProp = typeof children === 'function';

  return (
    <LazyErrorBoundary key={retryNonce} onError={handleError}>
      <Suspense fallback={fallback || defaultFallback}>
        {isRenderProp ? (
          // Render prop pattern: pass handleLoad as onReady callback
          // Component must call onReady when truly ready
          children(handleLoad)
        ) : (
          // ReactNode pattern: auto-signal ready on mount
          <LoadedCallback onLoad={handleLoad}>{children}</LoadedCallback>
        )}
      </Suspense>
    </LazyErrorBoundary>
  );
}
