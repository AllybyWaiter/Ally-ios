import { useState, useEffect, useCallback, useRef, RefObject } from 'react';

interface UseKeyboardVisibilityOptions {
  inputRef?: RefObject<HTMLElement>;
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
}

interface UseKeyboardVisibilityReturn {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  scrollInputIntoView: () => void;
}

export function useKeyboardVisibility(
  options: UseKeyboardVisibilityOptions = {}
): UseKeyboardVisibilityReturn {
  const { inputRef, onKeyboardShow, onKeyboardHide } = options;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track all active timeouts for cleanup
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Helper to create tracked timeouts
  const createTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId);
      callback();
    }, delay);
    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  // Scroll input into view when keyboard opens
  const scrollInputIntoView = useCallback(() => {
    if (inputRef?.current) {
      createTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [inputRef, createTimeout]);

  useEffect(() => {
    // Use visualViewport API for accurate keyboard detection on mobile
    const viewport = window.visualViewport;

    if (!viewport) return;

    // Track reference height that updates on orientation change
    let referenceHeight = viewport.height;
    let lastOrientation = window.screen?.orientation?.angle ?? 0;

    const handleResize = () => {
      const currentHeight = viewport.height;
      const currentOrientation = window.screen?.orientation?.angle ?? 0;

      // Detect orientation change - reset reference height
      if (currentOrientation !== lastOrientation) {
        lastOrientation = currentOrientation;
        // On orientation change, reset keyboard state and reference
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        // Wait for viewport to stabilize, then update reference height
        createTimeout(() => {
          referenceHeight = window.visualViewport?.height ?? currentHeight;
        }, 300);
        return;
      }

      const heightDiff = referenceHeight - currentHeight;

      // Keyboard is visible if height decreased significantly (more than 150px)
      const keyboardShowing = heightDiff > 150;

      if (keyboardShowing && !isKeyboardVisible) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(heightDiff);
        onKeyboardShow?.();
        scrollInputIntoView();
      } else if (!keyboardShowing && isKeyboardVisible) {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        onKeyboardHide?.();
      }

      // If viewport grew larger than reference (e.g., after orientation change settled), update reference
      if (currentHeight > referenceHeight && !keyboardShowing) {
        referenceHeight = currentHeight;
      }
    };

    // Also handle focus events as a backup
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true') {
        // Small delay to let keyboard animation start
        createTimeout(() => {
          if (viewport.height < referenceHeight - 150) {
            setIsKeyboardVisible(true);
            setKeyboardHeight(referenceHeight - viewport.height);
            onKeyboardShow?.();
          }
        }, 300);
      }
    };

    const handleBlur = () => {
      // Small delay to check if another input was focused
      createTimeout(() => {
        if (viewport.height >= referenceHeight - 50) {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
          onKeyboardHide?.();
        }
      }, 100);
    };

    // Handle orientation change event directly
    const handleOrientationChange = () => {
      // Reset keyboard state on orientation change
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      // Update reference height after orientation settles
      createTimeout(() => {
        referenceHeight = window.visualViewport?.height ?? window.innerHeight;
      }, 500);
    };

    viewport.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      window.removeEventListener('orientationchange', handleOrientationChange);
      // Clear all pending timeouts
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.clear();
    };
  }, [isKeyboardVisible, onKeyboardShow, onKeyboardHide, scrollInputIntoView, createTimeout]);

  return {
    isKeyboardVisible,
    keyboardHeight,
    scrollInputIntoView
  };
}
