/**
 * Calendar Gestures Hook
 * 
 * Handles swipe gestures for mobile calendar navigation
 * and task interactions.
 */

import { useCallback, useRef } from 'react';
import { useHaptics } from '@/hooks/useHaptics';

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

interface UseCalendarGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

interface GestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
}

export function useCalendarGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
}: UseCalendarGesturesOptions): GestureHandlers {
  const swipeStateRef = useRef<SwipeState | null>(null);
  const { light } = useHaptics();

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!e.touches.length) return;
    const touch = e.touches[0];
    swipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent scroll while swiping horizontally
    if (!swipeStateRef.current || !e.touches.length) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStateRef.current.startX;
    const deltaY = touch.clientY - swipeStateRef.current.startY;

    // If horizontal movement is greater, prevent default
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStateRef.current || !e.changedTouches.length) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStateRef.current.startX;
    const deltaY = touch.clientY - swipeStateRef.current.startY;
    const deltaTime = Date.now() - swipeStateRef.current.startTime;
    
    // Calculate velocity
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // Determine swipe direction
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const meetsThreshold = isHorizontalSwipe 
      ? Math.abs(deltaX) > threshold 
      : Math.abs(deltaY) > threshold;
    const meetsVelocity = isHorizontalSwipe 
      ? velocityX > velocityThreshold 
      : velocityY > velocityThreshold;

    if (meetsThreshold || meetsVelocity) {
      if (isHorizontalSwipe) {
        if (deltaX > 0 && onSwipeRight) {
          light();
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          light();
          onSwipeLeft();
        }
      } else {
        if (deltaY > 0 && onSwipeDown) {
          light();
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          light();
          onSwipeUp();
        }
      }
    }

    swipeStateRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold, light]);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  };
}

/**
 * Swipeable Task Row Hook
 * 
 * Handles swipe-to-complete and swipe-to-reschedule gestures on task rows.
 */
interface UseSwipeableTaskOptions {
  onSwipeLeft?: () => void;  // Complete
  onSwipeRight?: () => void; // Reschedule
  threshold?: number;
}

interface SwipeableState {
  offsetX: number;
  isDragging: boolean;
}

export function useSwipeableTask({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
}: UseSwipeableTaskOptions) {
  const swipeStateRef = useRef<SwipeState | null>(null);
  const offsetRef = useRef(0);
  const { medium } = useHaptics();

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!e.touches.length) return;
    const touch = e.touches[0];
    swipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
    offsetRef.current = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStateRef.current || !e.touches.length) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStateRef.current.startX;
    const deltaY = touch.clientY - swipeStateRef.current.startY;

    // Only track horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      offsetRef.current = deltaX;
      
      // Return transform value for the element
      return deltaX;
    }
    return 0;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!swipeStateRef.current) return;

    const offset = offsetRef.current;

    if (offset < -threshold && onSwipeLeft) {
      medium();
      onSwipeLeft();
    } else if (offset > threshold && onSwipeRight) {
      medium();
      onSwipeRight();
    }

    swipeStateRef.current = null;
    offsetRef.current = 0;
  }, [onSwipeLeft, onSwipeRight, threshold, medium]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    getOffset: () => offsetRef.current,
  };
}
