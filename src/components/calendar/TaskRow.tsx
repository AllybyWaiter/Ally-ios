/**
 * Task Row Component
 * 
 * Individual task item for use in the day detail panel.
 */

import { memo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Repeat, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarTask } from './types';
import { getTaskTypeConfig } from './types';

interface TaskRowProps {
  task: CalendarTask;
  onComplete: (taskId: string) => void;
  onNavigate?: (aquariumId: string) => void;
  isCompleting?: boolean;
}

export const TaskRow = memo(function TaskRow({
  task,
  onComplete,
  onNavigate,
  isCompleting,
}: TaskRowProps) {
  const config = getTaskTypeConfig(task.task_type);
  const isCompleted = task.status === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all',
        'bg-muted/30 hover:bg-muted/50',
        isCompleted && 'opacity-60',
      )}
    >
      {/* Task type indicator */}
      <div className={cn('w-1 self-stretch rounded-full', config.bgColor)} />

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn(
            'font-medium truncate',
            isCompleted && 'line-through text-muted-foreground',
          )}>
            {task.task_name}
          </h4>
          {task.is_recurring && (
            <Repeat className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Aquarium name */}
          <button
            onClick={() => onNavigate?.(task.aquarium_id)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors truncate max-w-[150px]"
          >
            {task.aquarium?.name || 'Unknown aquarium'}
          </button>

          {/* Task type badge */}
          <Badge
            variant="secondary"
            className={cn('text-xs capitalize', config.color)}
          >
            {task.task_type.replace('_', ' ')}
          </Badge>

          {/* Completed time */}
          {isCompleted && task.completed_date && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {format(new Date(task.completed_date), 'h:mm a')}
            </span>
          )}
        </div>

        {/* Notes preview */}
        {task.notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {task.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isCompleted && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onComplete(task.id)}
            disabled={isCompleting}
            className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Done
          </Button>
        )}

        {onNavigate && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onNavigate(task.aquarium_id)}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
});
