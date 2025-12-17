import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export const SuccessAnimation = ({ 
  show, 
  message, 
  className,
  size = "md" 
}: SuccessAnimationProps) => {
  if (!show) return null;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Ripple effect */}
        <div className="absolute inset-0 animate-ping rounded-full bg-green-400/30" />
        
        {/* Icon container with scale animation */}
        <div className="relative animate-scale-check">
          <CheckCircle 
            className={cn(
              sizeClasses[size],
              "text-green-500 drop-shadow-lg"
            )} 
            strokeWidth={2.5}
          />
        </div>
      </div>
      
      {message && (
        <p className="text-sm font-medium text-green-600 dark:text-green-400 animate-fade-up">
          {message}
        </p>
      )}
    </div>
  );
};

// Inline success checkmark for forms
export const InlineSuccess = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  return (
    <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium animate-fade-up">
      <CheckCircle className="h-4 w-4" />
      Saved
    </span>
  );
};
