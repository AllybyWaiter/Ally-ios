import { useState, useEffect, useCallback, RefObject } from 'react';

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

  // Scroll input into view when keyboard opens
  const scrollInputIntoView = useCallback(() => {
    if (inputRef?.current) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [inputRef]);

  useEffect(() => {
    // Use visualViewport API for accurate keyboard detection on mobile
    const viewport = window.visualViewport;
    
    if (!viewport) return;

    // Capture initial height at effect start for stable comparison
    const initialHeight = viewport.height;

    const handleResize = () => {
      const currentHeight = viewport.height;
      const heightDiff = initialHeight - currentHeight;
      
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
    };

    // Also handle focus events as a backup
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to let keyboard animation start
        setTimeout(() => {
          if (viewport.height < initialHeight - 150) {
            setIsKeyboardVisible(true);
            setKeyboardHeight(initialHeight - viewport.height);
            onKeyboardShow?.();
          }
        }, 300);
      }
    };

    const handleBlur = () => {
      // Small delay to check if another input was focused
      setTimeout(() => {
        if (viewport.height >= initialHeight - 50) {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
          onKeyboardHide?.();
        }
      }, 100);
    };

    viewport.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    // Note: orientation change will require remounting the component for new initial height
    // This is acceptable since orientation changes typically cause layout reflows anyway

    return () => {
      viewport.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [isKeyboardVisible, onKeyboardShow, onKeyboardHide, scrollInputIntoView]);

  return {
    isKeyboardVisible,
    keyboardHeight,
    scrollInputIntoView
  };
}
