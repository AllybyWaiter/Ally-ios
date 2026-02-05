import { memo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, FileText } from "lucide-react";
import { ParameterMini, ParameterMiniData } from "./ParameterMini";
import { formatDistanceToNow } from "date-fns";

export interface DataCardPayload {
  card_type: "latest_test" | "parameter_trend" | "tank_summary";
  title: string;
  aquarium_name: string;
  timestamp: string;
  test_count?: number;
  parameters: ParameterMiniData[];
}

interface DataCardProps {
  card: DataCardPayload;
}

const cardTypeConfig = {
  latest_test: {
    icon: FileText,
    label: "Latest Test",
    color: "text-blue-600 dark:text-blue-400",
    bgIcon: "bg-blue-500/10",
  },
  parameter_trend: {
    icon: TrendingUp,
    label: "Trends",
    color: "text-purple-600 dark:text-purple-400",
    bgIcon: "bg-purple-500/10",
  },
  tank_summary: {
    icon: Activity,
    label: "Summary",
    color: "text-emerald-600 dark:text-emerald-400",
    bgIcon: "bg-emerald-500/10",
  },
};

function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return timestamp;
  }
}

export const DataCard = memo(({ card }: DataCardProps) => {
  const config = cardTypeConfig[card.card_type];
  const Icon = config.icon;

  // Calculate overall health status from parameters
  const criticalCount = card.parameters.filter(
    (p) => p.status === "critical"
  ).length;
  const warningCount = card.parameters.filter(
    (p) => p.status === "warning"
  ).length;

  let healthStatus: "healthy" | "attention" | "critical" = "healthy";
  let healthLabel = "Looking good";
  if (criticalCount > 0) {
    healthStatus = "critical";
    healthLabel = `${criticalCount} critical`;
  } else if (warningCount > 0) {
    healthStatus = "attention";
    healthLabel = `${warningCount} need attention`;
  }

  const healthColors = {
    healthy: "bg-green-500/10 text-green-700 dark:text-green-400",
    attention: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    critical: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border bg-card p-4 my-3 animate-fade-in shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.bgIcon)}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{card.title}</h4>
            <p className="text-xs text-muted-foreground">
              {card.aquarium_name} &bull; {formatRelativeTime(card.timestamp)}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className={cn("text-xs", healthColors[healthStatus])}>
          {healthLabel}
        </Badge>
      </div>

      {/* Parameters Grid */}
      {card.parameters.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {card.parameters.map((param) => (
            <ParameterMini key={param.name} param={param} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No parameter data available
        </p>
      )}

      {/* Footer with test count */}
      {card.test_count && card.card_type !== "latest_test" && (
        <p className="text-xs text-muted-foreground text-center mt-3 pt-2 border-t">
          Based on {card.test_count} test{card.test_count > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
});

DataCard.displayName = "DataCard";
