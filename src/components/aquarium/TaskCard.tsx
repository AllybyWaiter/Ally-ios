import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2, Repeat } from "lucide-react";
import { format, isValid } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/lib/formatters";
import type { MaintenanceTask } from "@/infrastructure/queries";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getTaskTypeConfig } from "@/components/calendar/types";

const safeFormatDate = (dateValue: string | null | undefined, formatStr: string = "PP"): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) return 'Invalid date';
    return format(date, formatStr);
  } catch (_error) {
    return '';
  }
};

interface PendingTaskCardProps {
  task: MaintenanceTask;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

const getRecurrenceLabel = (interval?: string | null, days?: number | null): string => {
  if (!interval) return '';
  if (interval === 'custom' && days) return `Every ${days} days`;
  const labels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly',
  };
  return labels[interval] || '';
};

export const PendingTaskCard = memo(function PendingTaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
}: PendingTaskCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{task.task_name}</h4>
              <Badge variant="secondary">{getTaskTypeConfig(task.task_type || 'other').label}</Badge>
              {task.is_recurring && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1">
                      <Repeat className="w-3 h-3" />
                      Recurring
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {getRecurrenceLabel(task.recurrence_interval, task.recurrence_days)}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {t('tasks.due')} {safeFormatDate(task.due_date, 'PP')}
            </p>
            {task.notes && (
              <p className="text-sm text-muted-foreground">{task.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(task.id)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onComplete(task.id)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('tasks.complete')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

interface CompletedTaskCardProps {
  task: MaintenanceTask;
  onDelete: (taskId: string) => void;
}

export const CompletedTaskCard = memo(function CompletedTaskCard({
  task,
  onDelete,
}: CompletedTaskCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="opacity-60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{task.task_name}</h4>
              <Badge variant="secondary">{getTaskTypeConfig(task.task_type || 'other').label}</Badge>
              <Badge variant="outline">{t('tasks.completed')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('tasks.completedDate')} {task.completed_date && formatRelativeTime(task.completed_date)}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
