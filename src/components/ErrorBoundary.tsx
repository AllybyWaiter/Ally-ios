import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logError, FeatureArea, ErrorSeverity, FeatureAreaType } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallbackUI?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  featureArea?: FeatureAreaType;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Detect iOS PWA cold-start/stale cache errors and auto-recover
    // React #310 = "Minified React error #310" (invalid hook call due to stale modules)
    // Also catch destructuring errors from stale cached code
    const errorMessage = error.message || '';
    const errorString = error.toString() || '';
    
    const isReact310Error = 
      errorMessage.includes('#310') || 
      errorString.includes('#310') ||
      errorMessage.includes('Minified React error #310');
    
    const isDestructuringError = 
      errorMessage.includes('Right side of assignment cannot be destructured') ||
      errorMessage.includes('Cannot destructure property');
    
    const isModuleError = 
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('error loading dynamically imported module') ||
      errorMessage.includes('Importing a module script failed');
    
    if (isReact310Error || isDestructuringError || isModuleError) {
      console.warn('🔄 Detected iOS PWA stale cache error, auto-recovering...', {
        isReact310Error,
        isDestructuringError,
        isModuleError
      });
      this.handleClearCacheAndReload();
      return;
    }
    
    // Log to Sentry with feature area and high severity
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    }, this.props.featureArea || FeatureArea.GENERAL, ErrorSeverity.HIGH);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  private handleClearCacheAndReload = async () => {
    try {
      // Clear all Cache Storage API caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 Cleared', cacheNames.length, 'caches');
      }
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('🧹 Unregistered', registrations.length, 'service workers');
      }
      // Force bypass ALL cache layers (including iOS Safari HTTP cache) 
      // by using a cache-busting query parameter
      const url = new URL(window.location.href);
      url.searchParams.set('_cb', Date.now().toString());
      window.location.replace(url.toString());
    } catch (e) {
      console.error('Cache clear failed:', e);
      // Fallback: force reload with cache bypass
      window.location.href = window.location.pathname + '?_cb=' + Date.now();
    }
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
                  <CardDescription className="mt-1">
                    We encountered an unexpected error. Don't worry, your data is safe.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm text-muted-foreground">Error Details:</p>
                  <p className="text-sm font-mono text-destructive">
                    {this.state.error.toString()}
                  </p>
                  {import.meta.env.DEV && this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Stack trace (development only)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40 text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support with the error details above.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
