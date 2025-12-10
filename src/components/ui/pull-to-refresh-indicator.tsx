import { ArrowDown, RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isPastThreshold: boolean;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isPastThreshold,
  isRefreshing,
  threshold = 60
}: PullToRefreshIndicatorProps) {
  // Don't render if not pulling and not refreshing
  if (pullDistance === 0 && !isRefreshing) return null;

  // Calculate opacity based on pull distance
  const opacity = Math.min(pullDistance / threshold, 1);
  
  // Calculate vertical position
  const translateY = Math.min(pullDistance, threshold);

  return (
    <div 
      className="pull-indicator"
      style={{ 
        opacity: isRefreshing ? 1 : opacity,
        transform: `translateY(${isRefreshing ? threshold : translateY}px)`
      }}
    >
      <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg">
        {isRefreshing ? (
          <>
            <RefreshCw className="h-4 w-4 text-primary spin-refresh" />
            <span className="text-sm text-muted-foreground">Refreshing...</span>
          </>
        ) : (
          <>
            <ArrowDown 
              className={`h-4 w-4 text-primary pull-indicator-arrow ${isPastThreshold ? 'flipped' : ''}`}
            />
            <span className="text-sm text-muted-foreground">
              {isPastThreshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
