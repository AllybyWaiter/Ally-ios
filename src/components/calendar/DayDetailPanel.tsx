/**
 * Day Detail Panel Component
 * 
 * A rich panel showing detailed task view for a selected day.
 */

import { useMemo } from 'react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Sparkles, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { TaskRow } from './TaskRow';
import { CalendarEmptyState } from './CalendarEmptyState';
import type { CalendarTask } from './types';

interface DayDetailPanelProps {
  selectedDate: Date | null;
  tasks: CalendarTask[];
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
  onAddTask?: () => void;
  isCompleting?: boolean;
}

export function DayDetailPanel({
  selectedDate,
  tasks,
  onClose,
  onCompleteTask,
  onAddTask,
  isCompleting,
}: DayDetailPanelProps) {
  const navigate = useNavigate();

  const { pendingTasks, completedTasks, hasOverdue } = useMemo(() => {
    const today = startOfDay(new Date());
    const pending = tasks.filter(t => t.status === 'pending');
    const completed = tasks.filter(t => t.status === 'completed');
    const overdue = selectedDate && isBefore(selectedDate, today) && pending.length > 0;
    
    return {
      pendingTasks: pending,
      completedTasks: completed,
      hasOverdue: overdue,
    };
  }, [tasks, selectedDate]);

  const handleNavigateToAquarium = (aquariumId: string) => {
    navigate(`/aquarium/${aquariumId}`);
    onClose();
  };

  const dateLabel = selectedDate
    ? isToday(selectedDate)
      ? 'Today'
      : format(selectedDate, 'EEEE, MMMM d')
    : '';

  return (
    <Sheet open={!!selectedDate} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] rounded-t-2xl flex flex-col"
      >
        <SheetHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasOverdue ? (
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <SheetTitle className="text-left">{dateLabel}</SheetTitle>
                <SheetDescription className="text-left">
                  {tasks.length === 0
                    ? 'No tasks scheduled'
                    : `${pendingTasks.length} pending, ${completedTasks.length} completed`}
                </SheetDescription>
              </div>
            </div>

            {onAddTask && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddTask}
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {tasks.length === 0 ? (
            <CalendarEmptyState
              type="day"
              onAddTask={onAddTask}
            />
          ) : (
            <div className="space-y-2 pb-6">
              {/* Pending tasks */}
              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pending
                  </h4>
                  <AnimatePresence mode="popLayout">
                    {pendingTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onComplete={onCompleteTask}
                        onNavigate={handleNavigateToAquarium}
                        isCompleting={isCompleting}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Completed tasks */}
              {completedTasks.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Completed
                  </h4>
                  <AnimatePresence mode="popLayout">
                    {completedTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onComplete={onCompleteTask}
                        onNavigate={handleNavigateToAquarium}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* All done celebration */}
              {pendingTasks.length === 0 && completedTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-6 text-center"
                >
                  <div className="p-3 rounded-full bg-green-500/10 mb-3">
                    <Sparkles className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    All tasks completed!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Great job staying on track
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
