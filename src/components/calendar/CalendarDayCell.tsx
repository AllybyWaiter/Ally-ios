/**
 * Calendar Day Cell Component
 * 
 * Individual day cell with task indicators and interaction states.
 */

import { memo } from 'react';
import { format, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CalendarTask } from './types';
import { getTaskTypeConfig } from './types';

interface CalendarDayCellProps {
  day: Date;
  currentMonth: Date;
  tasks: CalendarTask[];
  isSelected?: boolean;
  isMobile?: boolean;
  onDayClick?: (date: Date) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (date: Date) => void;
  onTaskDragStart?: (task: CalendarTask) => void;
}

export const CalendarDayCell = memo(function CalendarDayCell({
  day,
  currentMonth,
  tasks,
  isSelected,
  isMobile,
  onDayClick,
  onDragOver,
  onDrop,
  onTaskDragStart,
}: CalendarDayCellProps) {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isToday = isSameDay(day, new Date());
  const today = startOfDay(new Date());
  
  // Check for overdue tasks
  const hasOverdue = tasks.some(
    t => t.status === 'pending' && isBefore(new Date(t.due_date), today) && !isSameDay(new Date(t.due_date), today)
  );
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Density-based background
  const getDensityClass = () => {
    if (pendingTasks.length === 0) return '';
    if (pendingTasks.length <= 2) return 'bg-primary/5';
    if (pendingTasks.length <= 4) return 'bg-primary/10';
    return 'bg-primary/15';
  };

  return (
    <motion.div
      whileHover={{ scale: isMobile ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onDayClick?.(day)}
      onDragOver={!isMobile ? onDragOver : undefined}
      onDrop={!isMobile ? () => onDrop?.(day) : undefined}
      className={cn(
        'relative min-h-[56px] md:min-h-[100px] p-1.5 md:p-2 rounded-xl transition-all cursor-pointer',
        'border border-transparent hover:border-border/50',
        isCurrentMonth ? 'bg-card/60' : 'bg-muted/20',
        isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isSelected && 'ring-2 ring-primary/50 bg-primary/5',
        hasOverdue && 'ring-1 ring-destructive/50',
        getDensityClass(),
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-xs md:text-sm font-semibold',
            !isCurrentMonth && 'text-muted-foreground/50',
            isToday && 'text-primary',
          )}
        >
          {format(day, 'd')}
        </span>

        {/* Completed indicator (desktop) */}
        {!isMobile && completedTasks.length > 0 && (
          <span className="text-[10px] text-green-500 font-medium">
            ✓{completedTasks.length}
          </span>
        )}
      </div>

      {/* Mobile: Task dots */}
      {isMobile && pendingTasks.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center mt-1">
          {pendingTasks.slice(0, 4).map((task) => {
            const config = getTaskTypeConfig(task.task_type);
            return (
              <div
                key={task.id}
                className={cn('w-2 h-2 rounded-full', config.bgColor)}
              />
            );
          })}
          {pendingTasks.length > 4 && (
            <span className="text-[9px] text-muted-foreground ml-0.5">
              +{pendingTasks.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Desktop: Task cards */}
      {!isMobile && (
        <div className="space-y-1 overflow-hidden">
          {pendingTasks.slice(0, 3).map((task) => {
            const config = getTaskTypeConfig(task.task_type);
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onTaskDragStart?.(task);
                }}
                className={cn(
                  'text-[10px] md:text-xs p-1.5 rounded-md cursor-grab',
                  'hover:opacity-90 transition-all hover:shadow-sm',
                  'active:cursor-grabbing',
                  config.bgColor,
                  'text-white',
                )}
                title={`${task.task_name} - ${task.aquarium?.name || 'Unknown'}`}
              >
                <div className="font-medium truncate leading-tight">
                  {task.task_name}
                </div>
                <div className="truncate opacity-80 leading-tight">
                  {task.aquarium?.name}
                </div>
              </div>
            );
          })}
          {pendingTasks.length > 3 && (
            <div className="text-[10px] text-muted-foreground text-center py-0.5">
              +{pendingTasks.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Overdue indicator */}
      {hasOverdue && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
      )}
    </motion.div>
  );
});
