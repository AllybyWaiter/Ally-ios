/**
 * Calendar Empty State Component
 * 
 * Friendly empty states for various calendar scenarios.
 */

import { motion } from 'framer-motion';
import { Calendar, Plus, Sparkles, Fish } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateType = 'day' | 'month' | 'first-time';

interface CalendarEmptyStateProps {
  type: EmptyStateType;
  onAddTask?: () => void;
}

const EMPTY_STATES = {
  day: {
    icon: Calendar,
    title: 'No tasks for this day',
    description: 'Enjoy the calm, or schedule something new.',
    buttonText: 'Schedule Task',
  },
  month: {
    icon: Sparkles,
    title: 'All caught up!',
    description: 'No pending tasks this month. Your aquariums are in great shape.',
    buttonText: 'Plan Ahead',
  },
  'first-time': {
    icon: Fish,
    title: 'Welcome to your Calendar',
    description: "Let's set up your first maintenance schedule to keep your aquariums healthy.",
    buttonText: 'Create First Task',
  },
};

export function CalendarEmptyState({ type, onAddTask }: CalendarEmptyStateProps) {
  const state = EMPTY_STATES[type];
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
        <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/50">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </motion.div>

      {/* Text content */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold mb-2"
      >
        {state.title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground max-w-xs mb-6"
      >
        {state.description}
      </motion.p>

      {/* Action button */}
      {onAddTask && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={onAddTask} className="gap-2">
            <Plus className="w-4 h-4" />
            {state.buttonText}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
