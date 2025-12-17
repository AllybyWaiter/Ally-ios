import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [30, 50, 30],
  error: [50, 30, 50, 30, 50],
  selection: 5,
};

export function useHaptics() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = useCallback((pattern: HapticPattern = 'light') => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Silently fail if vibration not allowed
    }
  }, [isSupported]);

  return {
    isSupported,
    trigger,
    light: useCallback(() => trigger('light'), [trigger]),
    medium: useCallback(() => trigger('medium'), [trigger]),
    heavy: useCallback(() => trigger('heavy'), [trigger]),
    success: useCallback(() => trigger('success'), [trigger]),
    error: useCallback(() => trigger('error'), [trigger]),
    selection: useCallback(() => trigger('selection'), [trigger]),
  };
}

// Standalone function for use outside React components
export function triggerHaptic(pattern: HapticPattern = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Silently fail
    }
  }
}
