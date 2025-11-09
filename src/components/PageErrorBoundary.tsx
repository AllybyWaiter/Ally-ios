import React, { ReactNode } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ErrorBoundary from './ErrorBoundary';
import { FeatureAreaType } from '@/lib/sentry';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
  featureArea?: FeatureAreaType;
}

const PageErrorFallback = ({ pageName }: { pageName?: string }) => (
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
        <CardContent>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const PageErrorBoundary = ({ children, pageName, featureArea }: PageErrorBoundaryProps) => {
  return (
    <ErrorBoundary fallbackUI={<PageErrorFallback pageName={pageName} />} featureArea={featureArea}>
      {children}
    </ErrorBoundary>
  );
};
