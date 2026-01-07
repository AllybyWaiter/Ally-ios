/**
 * Calendar Hero Banner
 * 
 * A contextual, time-of-day aware hero section for the calendar page.
 * Displays personalized messages based on task status and time.
 */

import { useMemo } from 'react';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Calendar, Sparkles } from 'lucide-react';

interface CalendarHeroBannerProps {
  todayCount: number;
  overdueCount: number;
  completedCount: number;
  thisWeekCount: number;
}

export function CalendarHeroBanner({
  todayCount,
  overdueCount,
  completedCount,
  thisWeekCount,
}: CalendarHeroBannerProps) {
  const { greeting } = useTimeOfDay();
  const { userName } = useAuth();

  const firstName = userName?.split(' ')[0];

  // Contextual message based on task status
  const { message, subMessage, icon: Icon, mood } = useMemo(() => {
    if (overdueCount > 0) {
      return {
        message: `You have ${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''}`,
        subMessage: "Let's catch up on maintenance",
        icon: AlertTriangle,
        mood: 'warning' as const,
      };
    }

    if (todayCount === 0 && thisWeekCount === 0) {
      return {
        message: 'All caught up!',
        subMessage: 'No tasks scheduled. Enjoy the calm.',
        icon: Sparkles,
        mood: 'success' as const,
      };
    }

    if (todayCount > 0) {
      return {
        message: `${todayCount} task${todayCount !== 1 ? 's' : ''} scheduled today`,
        subMessage: 'Stay on track with your maintenance',
        icon: Calendar,
        mood: 'active' as const,
      };
    }

    return {
      message: `${thisWeekCount} task${thisWeekCount !== 1 ? 's' : ''} this week`,
      subMessage: 'Plan ahead for smooth operations',
      icon: CheckCircle2,
      mood: 'neutral' as const,
    };
  }, [todayCount, overdueCount, thisWeekCount]);

  const moodStyles = {
    warning: 'from-amber-500/20 via-orange-500/10 to-transparent',
    success: 'from-green-500/20 via-emerald-500/10 to-transparent',
    active: 'from-primary/20 via-primary/10 to-transparent',
    neutral: 'from-secondary/20 via-secondary/10 to-transparent',
  };

  const iconStyles = {
    warning: 'text-amber-500',
    success: 'text-green-500',
    active: 'text-primary',
    neutral: 'text-secondary-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm"
    >
      {/* Background gradient based on mood */}
      <div className={`absolute inset-0 bg-gradient-to-br ${moodStyles[mood]}`} />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`p-3 rounded-xl bg-background/50 backdrop-blur-sm ${iconStyles[mood]}`}
          >
            <Icon className="w-6 h-6 md:w-8 md:h-8" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Greeting */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mb-1"
            >
              {greeting}{firstName ? `, ${firstName}` : ''}
            </motion.p>

            {/* Main message */}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground"
            >
              {message}
            </motion.h1>

            {/* Sub message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm md:text-base text-muted-foreground mt-1"
            >
              {subMessage}
            </motion.p>
          </div>

          {/* Stats badge - desktop only */}
          {completedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{completedCount} completed this month</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
