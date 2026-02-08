/**
 * Calendar Timeline Component
 * 
 * A horizontal timeline showing today's tasks with visual time blocks
 * and current time indicator.
 */

import { useMemo, useEffect, useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarTask } from './types';
import { getTaskTypeConfig } from './types';

interface CalendarTimelineProps {
  tasks: CalendarTask[];
  onTaskClick?: (task: CalendarTask) => void;
  onCompleteTask?: (taskId: string) => void;
}

export function CalendarTimeline({
  tasks,
  onTaskClick,
  onCompleteTask,
}: CalendarTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter to today's tasks only
  const todayTasks = useMemo(() => {
    const today = new Date();
    return tasks.filter(task => {
      const taskDate = parseISO(task.due_date);
      return isSameDay(taskDate, today);
    });
  }, [tasks]);

  // Calculate timeline hours (6am to 10pm)
  const timelineHours = useMemo(() => {
    const hours = [];
    for (let i = 6; i <= 22; i += 2) {
      hours.push(i);
    }
    return hours;
  }, []);

  // Calculate current time position (as percentage)
  const currentTimePosition = useMemo(() => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const totalMinutes = (hour - 6) * 60 + minute;
    const maxMinutes = (22 - 6) * 60; // 16 hours = 960 minutes
    return Math.min(Math.max((totalMinutes / maxMinutes) * 100, 0), 100);
  }, [currentTime]);

  // Check if current time is within timeline range
  const showCurrentTime = currentTime.getHours() >= 6 && currentTime.getHours() <= 22;

  if (todayTasks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="p-2 rounded-lg bg-primary/10">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Today's Schedule</h3>
          <p className="text-xs text-muted-foreground">
            {todayTasks.filter(t => t.status === 'pending').length} pending, {' '}
            {todayTasks.filter(t => t.status === 'completed').length} completed
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 overflow-x-auto">
        <div className="relative min-w-[600px]">
          {/* Hour markers */}
          <div className="flex justify-between mb-2">
            {timelineHours.map(hour => (
              <span
                key={hour}
                className="text-xs text-muted-foreground font-medium"
              >
                {format(new Date().setHours(hour, 0), 'ha')}
              </span>
            ))}
          </div>

          {/* Timeline track */}
          <div className="relative h-2 bg-muted rounded-full mb-4">
            {/* Current time indicator */}
            {showCurrentTime && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-1/2 -translate-y-1/2 z-20"
                style={{ left: `${currentTimePosition}%` }}
              >
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background animate-pulse" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                      {format(currentTime, 'h:mm a')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Progress fill */}
            {showCurrentTime && (
              <div
                className="absolute inset-y-0 left-0 bg-primary/30 rounded-full"
                style={{ width: `${currentTimePosition}%` }}
              />
            )}
          </div>

          {/* Task cards */}
          <div className="flex gap-2 flex-wrap">
            {todayTasks.map((task, index) => {
              const config = getTaskTypeConfig(task.task_type);
              const isCompleted = task.status === 'completed';
              const Icon = config.icon;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onTaskClick?.(task)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer',
                    'transition-all hover:shadow-md',
                    isCompleted
                      ? 'bg-muted/50 border-border/50 opacity-60'
                      : `${config.bgColor} border-transparent text-white`,
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isCompleted && 'line-through'
                    )}>
                      {task.task_name}
                    </p>
                    <p className={cn(
                      'text-xs truncate',
                      isCompleted ? 'text-muted-foreground' : 'opacity-80'
                    )}>
                      {task.aquarium?.name}
                    </p>
                  </div>
                  
                  {!isCompleted && onCompleteTask && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task.id);
                      }}
                      className="p-1 rounded-full hover:bg-white/20 transition-colors"
                      aria-label="Complete task"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
