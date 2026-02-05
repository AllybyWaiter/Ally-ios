import { memo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
  color?: string;
}

export const Sparkline = memo(({ data, className, color }: SparklineProps) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Build SVG polyline points
  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

Sparkline.displayName = "Sparkline";
