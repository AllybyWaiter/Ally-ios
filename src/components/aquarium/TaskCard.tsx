import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { format, isValid } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/lib/formatters";
import type { MaintenanceTask } from "@/infrastructure/queries";

const safeFormatDate = (dateValue: string | null | undefined, formatStr: string = "PP"): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) return 'Invalid date';
    return format(date, formatStr);
  } catch (error) {
    return '';
  }
};

interface PendingTaskCardProps {
  task: MaintenanceTask;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

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
              <Badge variant="secondary">{task.task_type || ''}</Badge>
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
              <Badge variant="secondary">{task.task_type}</Badge>
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
