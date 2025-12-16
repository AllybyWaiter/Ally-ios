import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";

interface ThinkingIndicatorProps {
  className?: string;
}

export const ThinkingIndicator = ({ className }: ThinkingIndicatorProps) => {
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
      <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
        Thinking deeply...
      </span>
    </div>
  );
};
