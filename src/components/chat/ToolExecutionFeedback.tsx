import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Wrench,
  Droplets,
  Fish,
  Leaf,
  Calendar,
  Brain,
  Calculator,
  AlertCircle,
  Settings,
  Package,
} from "lucide-react";

export interface ToolExecution {
  toolName: string;
  success: boolean;
  message: string;
}

interface ToolExecutionFeedbackProps {
  executions: ToolExecution[];
}

// Map tool names to icons and display labels
const toolConfig: Record<string, { icon: typeof Check; label: string }> = {
  save_memory: { icon: Brain, label: "Memory saved" },
  add_equipment: { icon: Wrench, label: "Equipment added" },
  add_equipment_batch: { icon: Package, label: "Equipment added" },
  create_task: { icon: Calendar, label: "Task scheduled" },
  log_water_test: { icon: Droplets, label: "Water test logged" },
  add_livestock: { icon: Fish, label: "Livestock added" },
  add_plant: { icon: Leaf, label: "Plant added" },
  update_livestock: { icon: Fish, label: "Livestock updated" },
  update_plant: { icon: Leaf, label: "Plant updated" },
  update_equipment: { icon: Settings, label: "Equipment updated" },
  calculate_pool_volume: { icon: Calculator, label: "Volume calculated" },
  check_fish_compatibility: { icon: AlertCircle, label: "Compatibility checked" },
};

const ToolExecutionItem = memo(({ execution }: { execution: ToolExecution }) => {
  const config = toolConfig[execution.toolName] || { icon: Wrench, label: "Action completed" };
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all animate-fade-in",
        execution.success
          ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
          : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
      )}
    >
      {execution.success ? (
        <Check className="h-3 w-3 flex-shrink-0" />
      ) : (
        <X className="h-3 w-3 flex-shrink-0" />
      )}
      <Icon className="h-3 w-3 flex-shrink-0 opacity-70" />
      <span className="truncate">{execution.message || config.label}</span>
    </div>
  );
});

ToolExecutionItem.displayName = "ToolExecutionItem";

export const ToolExecutionFeedback = memo(({ executions }: ToolExecutionFeedbackProps) => {
  if (!executions || executions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {executions.map((execution, index) => (
        <ToolExecutionItem key={`${execution.toolName}-${index}`} execution={execution} />
      ))}
    </div>
  );
});

ToolExecutionFeedback.displayName = "ToolExecutionFeedback";
