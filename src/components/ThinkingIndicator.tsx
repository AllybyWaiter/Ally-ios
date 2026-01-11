import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { useState, useEffect } from "react";

interface ThinkingIndicatorProps {
  className?: string;
  startTime?: number;
}

export const ThinkingIndicator = ({ className, startTime }: ThinkingIndicatorProps) => {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const start = startTime || Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        {/* Pulsing glow ring */}
        <div className="absolute inset-0 rounded-full bg-amber-500/30 animate-thinking-ping" />
        {/* Rotating ring */}
        <div className="absolute -inset-1.5 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-500/50 animate-thinking-spin" />
        {/* Brain icon */}
        <Brain className="h-5 w-5 text-amber-500 animate-thinking-pulse relative z-10" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
          Thinking deeply...
        </span>
        {elapsed > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {elapsed}s
          </span>
        )}
      </div>
    </div>
  );
};
