import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  isPastThreshold: boolean;
}

export function usePullToRefresh(
  containerRef: RefObject<HTMLElement>,
  options: UsePullToRefreshOptions
): UsePullToRefreshReturn {
  const { onRefresh, threshold = 60, maxPull = 120, disabled = false } = options;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const startY = useRef(0);
  const isPulling = useRef(false);
  const lastRefreshTime = useRef(0);
  const isRefreshingRef = useRef(false); // Ref-based lock to prevent race conditions
  
  const isPastThreshold = pullDistance >= threshold;

  // Check if we're on a touch device
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !isTouchDevice) return;
    
    // Check scroll position - support both window and container scroll
    const container = containerRef.current;
    const scrollTop = container ? container.scrollTop : window.scrollY;
    
    // Only activate if at the top
    if (scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [disabled, isRefreshing, isTouchDevice, containerRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    
    // Check scroll position - support both window and container scroll
    const container = containerRef.current;
    const scrollTop = container ? container.scrollTop : window.scrollY;
    
    // Only activate if still at top
    if (scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only allow pulling down, not up
    if (diff < 0) {
      setPullDistance(0);
      return;
    }
    
    // Apply exponential decay for tension effect
    const tension = 0.4;
    const decayedDistance = Math.min(diff * tension, maxPull);
    
    setPullDistance(decayedDistance);
    
    // Prevent native scroll/refresh when pulling
    if (decayedDistance > 10) {
      e.preventDefault();
    }
  }, [disabled, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    
    isPulling.current = false;
    
    // Check debounce (1 second cooldown)
    const now = Date.now();
    if (now - lastRefreshTime.current < 1000) {
      setPullDistance(0);
      return;
    }
    
    if (pullDistance >= threshold && !isRefreshing && !disabled && !isRefreshingRef.current) {
      isRefreshingRef.current = true; // Set ref immediately to prevent race condition
      lastRefreshTime.current = now;
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setIsRefreshing(false);
        isRefreshingRef.current = false; // Reset ref lock
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, disabled, onRefresh]);

  useEffect(() => {
    if (!isTouchDevice || disabled) return;
    
    // Capture container at effect start to ensure cleanup uses same reference
    const container = containerRef.current || document;
    
    // Use passive: false only for touchmove to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    container.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    
    // Cleanup uses the captured container reference
    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd, isTouchDevice, disabled]);

  // Reset pull distance when disabled changes
  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      isPulling.current = false;
    }
  }, [disabled]);

  return {
    isRefreshing,
    pullDistance,
    isPastThreshold
  };
}
