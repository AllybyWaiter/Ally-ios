/**
 * Long Press Detection Hook
 * 
 * Detects long press gestures for mobile/touch devices
 * with haptic feedback integration.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useHaptics } from './useHaptics';

interface UseLongPressOptions {
  threshold?: number; // Duration in ms before triggering (default: 500ms)
  onLongPress: () => void;
  onPress?: () => void;
}

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onPress,
}: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const { medium } = useHaptics();

  const start = useCallback((x: number, y: number) => {
    isLongPressRef.current = false;
    startPosRef.current = { x, y };
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      medium(); // Haptic feedback
      onLongPress();
    }, threshold);
  }, [threshold, onLongPress, medium]);

  const cancel = useCallback((triggerPress: boolean = false) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (triggerPress && !isLongPressRef.current && onPress) {
      onPress();
    }
    
    startPosRef.current = null;
  }, [onPress]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    start(touch.clientX, touch.clientY);
  }, [start]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    // Don't trigger press if it was a long press
    cancel(!isLongPressRef.current);
    e.preventDefault(); // Prevent click event
  }, [cancel]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Cancel if moved more than 10px
    if (startPosRef.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      if (dx > 10 || dy > 10) {
        cancel(false);
      }
    }
  }, [cancel]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only trigger on left click
    if (e.button !== 0) return;
    start(e.clientX, e.clientY);
  }, [start]);

  const onMouseUp = useCallback(() => {
    cancel(!isLongPressRef.current);
  }, [cancel]);

  const onMouseLeave = useCallback(() => {
    cancel(false);
  }, [cancel]);

  // Clear pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  };
}
