import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
  label?: string;
}

function Skeleton({ className, shimmer = true, label = "Loading...", ...props }: SkeletonProps) {
  return (
    <div 
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn(
        "rounded-md bg-muted",
        shimmer 
          ? "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent"
          : "animate-pulse",
        className
      )} 
      {...props} 
    />
  );
}

export { Skeleton };
