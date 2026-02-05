import { memo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparkline } from "./Sparkline";

export interface ParameterMiniData {
  name: string;
  value: number;
  unit: string;
  status: "good" | "warning" | "critical";
  trend?: "up" | "down" | "stable";
  sparkline?: number[];
  change?: number;
}

interface ParameterMiniProps {
  param: ParameterMiniData;
}

const statusConfig = {
  good: {
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    sparkline: "#22c55e",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    sparkline: "#f59e0b",
  },
  critical: {
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    sparkline: "#ef4444",
  },
};

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };
  const Icon = icons[trend];
  return <Icon className="h-3 w-3 opacity-60" />;
};

export const ParameterMini = memo(({ param }: ParameterMiniProps) => {
  const config = statusConfig[param.status];

  // Format value for display
  const displayValue =
    param.value % 1 === 0 ? param.value : param.value.toFixed(2);

  return (
    <div
      className={cn(
        "rounded-lg p-2.5 border transition-colors",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground truncate">
          {param.name}
        </span>
        {param.trend && <TrendIcon trend={param.trend} />}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={cn("text-lg font-semibold", config.text)}>
          {displayValue}
        </span>
        <span className="text-xs text-muted-foreground">{param.unit}</span>
      </div>
      {param.sparkline && param.sparkline.length > 1 && (
        <Sparkline
          data={param.sparkline}
          className="mt-2 h-5"
          color={config.sparkline}
        />
      )}
    </div>
  );
});

ParameterMini.displayName = "ParameterMini";
