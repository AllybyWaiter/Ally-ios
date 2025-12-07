import React, { ReactNode, useState } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ErrorBoundary from './ErrorBoundary';
import { FeatureAreaType } from '@/lib/sentry';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
  featureArea?: FeatureAreaType;
}

const PageErrorFallback = ({ pageName }: { pageName?: string }) => {
  const [clearing, setClearing] = useState(false);

  const handleClearCacheAndRetry = async () => {
    setClearing(true);
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      // Force reload from server
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 pt-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle>Unable to load {pageName || 'this page'}</CardTitle>
                <CardDescription>
                  An error occurred while loading the page content.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button 
              onClick={handleClearCacheAndRetry} 
              variant="secondary"
              disabled={clearing}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {clearing ? 'Clearing...' : 'Clear Cache & Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const PageErrorBoundary = ({ children, pageName, featureArea }: PageErrorBoundaryProps) => {
  return (
    <ErrorBoundary fallbackUI={<PageErrorFallback pageName={pageName} />} featureArea={featureArea}>
      {children}
    </ErrorBoundary>
  );
};
