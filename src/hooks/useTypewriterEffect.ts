import { useRef, useEffect, useState } from "react";

// Punctuation sets for pause detection
const SENTENCE_PUNCTUATION = new Set(['.', '!', '?']);
const CLAUSE_PUNCTUATION = new Set([',', ';', ':', '—', '–']);

interface UseTypewriterEffectOptions {
  /** Characters per second (default: 50) */
  charsPerSecond?: number;
  /** Whether the typewriter is actively typing */
  isActive: boolean;
  /** Pause duration after sentence-ending punctuation in ms (default: 120) */
  sentencePauseMs?: number;
  /** Pause duration after clause punctuation in ms (default: 40) */
  clausePauseMs?: number;
}

interface UseTypewriterEffectReturn {
  /** The content to display (gradually revealed) */
  displayedContent: string;
  /** Whether all content has been revealed */
  isComplete: boolean;
}

/**
 * Hook that creates a smooth typewriter effect for streaming text.
 * Reveals characters at a natural typing speed with pauses after punctuation.
 */
export function useTypewriterEffect(
  content: string,
  options: UseTypewriterEffectOptions
): UseTypewriterEffectReturn {
  const { 
    charsPerSecond = 50, 
    isActive,
    sentencePauseMs = 120,
    clausePauseMs = 40,
  } = options;
  
  const [displayedLength, setDisplayedLength] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const pauseRemainingRef = useRef<number>(0);
  
  // Time per character in milliseconds
  const msPerChar = 1000 / charsPerSecond;
  
  // Reset when content starts fresh (new message)
  useEffect(() => {
    if (content.length === 0) {
      setDisplayedLength(0);
      accumulatedTimeRef.current = 0;
      pauseRemainingRef.current = 0;
    }
  }, [content.length === 0]);

  // Check if we should pause after this character
  const getPauseForChar = (char: string, nextChar: string | undefined): number => {
    // Only pause if followed by a space or end of content (avoid pausing for "..." or "Dr.")
    const isFollowedBySpace = !nextChar || nextChar === ' ' || nextChar === '\n';
    
    if (!isFollowedBySpace) return 0;
    
    if (SENTENCE_PUNCTUATION.has(char)) {
      return sentencePauseMs;
    }
    if (CLAUSE_PUNCTUATION.has(char)) {
      return clausePauseMs;
    }
    return 0;
  };

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
      
      // Handle punctuation pause
      if (pauseRemainingRef.current > 0) {
        pauseRemainingRef.current -= deltaTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      accumulatedTimeRef.current += deltaTime;
      
      // Calculate how many characters we should reveal
      setDisplayedLength(prev => {
        const targetLength = content.length;
        const charsBehind = targetLength - prev;
        
        // Skip pauses when catching up (>30 chars behind)
        const shouldSkipPauses = charsBehind > 30;
        
        const charsToReveal = Math.floor(accumulatedTimeRef.current / msPerChar);
        
        if (charsToReveal > 0) {
          accumulatedTimeRef.current = accumulatedTimeRef.current % msPerChar;
          
          // Adaptive speed: if queue is building up, speed up
          const adaptiveChars = charsBehind > 30 
            ? Math.min(charsToReveal + Math.floor(charsBehind / 10), 5) 
            : charsToReveal;
          
          const newLength = Math.min(prev + adaptiveChars, targetLength);
          
          // Check for punctuation pause (only if not catching up)
          if (!shouldSkipPauses && newLength > prev) {
            const lastRevealedChar = content[newLength - 1];
            const nextChar = content[newLength];
            const pause = getPauseForChar(lastRevealedChar, nextChar);
            if (pause > 0) {
              pauseRemainingRef.current = pause;
            }
          }
          
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
  }, [isActive, content.length, msPerChar, sentencePauseMs, clausePauseMs]);

  // Reset timing refs when streaming starts
  useEffect(() => {
    if (isActive && displayedLength === 0) {
      lastTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      pauseRemainingRef.current = 0;
    }
  }, [isActive, displayedLength]);

  return {
    displayedContent: content.slice(0, displayedLength),
    isComplete: displayedLength >= content.length,
  };
}
