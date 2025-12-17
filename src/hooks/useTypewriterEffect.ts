import { useRef, useEffect, useState, useCallback } from "react";

interface UseTypewriterEffectOptions {
  /** Characters per second (default: 50) */
  charsPerSecond?: number;
  /** Whether the typewriter is actively typing */
  isActive: boolean;
}

interface UseTypewriterEffectReturn {
  /** The content to display (gradually revealed) */
  displayedContent: string;
  /** Whether all content has been revealed */
  isComplete: boolean;
}

/**
 * Hook that creates a smooth typewriter effect for streaming text.
 * Reveals characters at a natural typing speed regardless of how fast tokens arrive.
 */
export function useTypewriterEffect(
  content: string,
  options: UseTypewriterEffectOptions
): UseTypewriterEffectReturn {
  const { charsPerSecond = 50, isActive } = options;
  
  const [displayedLength, setDisplayedLength] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  
  // Time per character in milliseconds
  const msPerChar = 1000 / charsPerSecond;
  
  // Reset when content starts fresh (new message)
  useEffect(() => {
    if (content.length === 0) {
      setDisplayedLength(0);
      accumulatedTimeRef.current = 0;
    }
  }, [content.length === 0]);

  // Animation loop
  useEffect(() => {
    if (!isActive) {
      // When streaming ends, show all content immediately
      setDisplayedLength(content.length);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      accumulatedTimeRef.current += deltaTime;
      
      // Calculate how many characters we should reveal
      setDisplayedLength(prev => {
        const targetLength = content.length;
        
        // If we're way behind, catch up faster
        const charsToReveal = Math.floor(accumulatedTimeRef.current / msPerChar);
        
        if (charsToReveal > 0) {
          accumulatedTimeRef.current = accumulatedTimeRef.current % msPerChar;
          
          // Adaptive speed: if queue is building up (>30 chars behind), speed up
          const charsBehind = targetLength - prev;
          const adaptiveChars = charsBehind > 30 
            ? Math.min(charsToReveal + Math.floor(charsBehind / 10), 5) 
            : charsToReveal;
          
          const newLength = Math.min(prev + adaptiveChars, targetLength);
          return newLength;
        }
        
        return prev;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive, content.length, msPerChar]);

  // Reset timing refs when streaming starts
  useEffect(() => {
    if (isActive && displayedLength === 0) {
      lastTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
    }
  }, [isActive, displayedLength]);

  return {
    displayedContent: content.slice(0, displayedLength),
    isComplete: displayedLength >= content.length,
  };
}
