/**
 * Week At Glance Component
 * 
 * A compact statistics widget showing task overview for the current week.
 */

import { motion } from 'framer-motion';
import { Calendar, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WeekAtGlanceProps {
  todayCount: number;
  overdueCount: number;
  thisWeekCount: number;
  completedCount: number;
  totalPending: number;
  onAddTask?: () => void;
}

export function WeekAtGlance({
  todayCount,
  overdueCount,
  thisWeekCount,
  completedCount,
  totalPending,
  onAddTask,
}: WeekAtGlanceProps) {
  // Calculate completion percentage for the visual ring
  const totalTasks = completedCount + totalPending;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const stats = [
    {
      label: 'Today',
      value: todayCount,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      icon: AlertTriangle,
      color: overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: overdueCount > 0 ? 'bg-destructive/10' : 'bg-muted/50',
    },
    {
      label: 'This Week',
      value: thisWeekCount,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Week at a Glance
        </h3>
        {onAddTask && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddTask}
            className="h-8 px-3 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Task
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`flex flex-col items-center p-3 rounded-lg ${stat.bgColor}`}
          >
            <stat.icon className={`w-5 h-5 mb-1 ${stat.color}`} />
            <span className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Monthly Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      )}
    </motion.div>
  );
}
