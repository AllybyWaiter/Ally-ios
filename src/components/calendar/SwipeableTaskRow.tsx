/**
 * Swipeable Task Row Component
 * 
 * A task row that supports swipe gestures for quick actions:
 * - Swipe left: Complete task
 * - Swipe right: Reschedule task
 */

import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { CheckCircle2, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import type { CalendarTask } from './types';
import { getTaskTypeConfig } from './types';

interface SwipeableTaskRowProps {
  task: CalendarTask;
  onComplete: (taskId: string) => void;
  onReschedule?: (taskId: string) => void;
  onNavigate?: (aquariumId: string) => void;
  isCompleting?: boolean;
}

const SWIPE_THRESHOLD = 80;

export function SwipeableTaskRow({
  task,
  onComplete,
  onReschedule,
  onNavigate,
  isCompleting,
}: SwipeableTaskRowProps) {
  const [isReleased, setIsReleased] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const { medium, light } = useHaptics();

  // Transform values based on drag position
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD/2, 0], [1, 0.8, 0.5]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD/2, SWIPE_THRESHOLD], [0.5, 0.8, 1]);

  const config = getTaskTypeConfig(task.task_type);
  const Icon = config.icon;
  const isCompleted = task.status === 'completed';

  const handleDragEnd = useCallback((
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Check if swipe threshold is met
    const shouldComplete = offset < -SWIPE_THRESHOLD || velocity < -500;
    const shouldReschedule = offset > SWIPE_THRESHOLD || velocity > 500;

    if (shouldComplete && !isCompleted) {
      medium();
      setIsReleased(true);
      setTimeout(() => {
        onComplete(task.id);
        setIsReleased(false);
      }, 200);
    } else if (shouldReschedule && onReschedule) {
      medium();
      onReschedule(task.id);
    }
  }, [task.id, isCompleted, onComplete, onReschedule, medium]);

  const handleDrag = useCallback((
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Haptic feedback when crossing threshold
    const offset = info.offset.x;
    if (Math.abs(offset) === SWIPE_THRESHOLD) {
      light();
    }
  }, [light]);

  if (isCompleted) {
    // Non-swipeable completed task
    return (
      <div
        onClick={() => task.aquarium && onNavigate?.(task.aquarium.id)}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'bg-muted/30 border border-border/30',
          'transition-all cursor-pointer hover:bg-muted/50',
        )}
      >
        <div className={cn('p-2 rounded-lg', 'bg-green-500/10')}>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-through text-muted-foreground truncate">
            {task.task_name}
          </p>
          <p className="text-xs text-muted-foreground/60 truncate">
            {task.aquarium?.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-xl">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Right action (reschedule) - shows when swiping right */}
        <motion.div
          style={{ opacity: rightOpacity }}
          className="flex-1 flex items-center justify-start pl-4 bg-blue-500"
        >
          <motion.div style={{ scale: rightScale }} className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Reschedule</span>
          </motion.div>
        </motion.div>

        {/* Left action (complete) - shows when swiping left */}
        <motion.div
          style={{ opacity: leftOpacity }}
          className="flex-1 flex items-center justify-end pr-4 bg-green-500"
        >
          <motion.div style={{ scale: leftScale }} className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">Complete</span>
            <CheckCircle2 className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>

      {/* Draggable task card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: onReschedule ? 120 : 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={isReleased ? { x: -300, opacity: 0 } : { x: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        onClick={() => task.aquarium && onNavigate?.(task.aquarium.id)}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'bg-card border border-border/50',
          'transition-shadow cursor-grab active:cursor-grabbing',
          'hover:shadow-md',
          isCompleting && 'opacity-50 pointer-events-none',
        )}
      >
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {task.task_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {task.aquarium?.name}
          </p>
        </div>

        {task.is_recurring && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            Recurring
          </span>
        )}

        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.div>

      {/* Swipe hint for mobile */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  );
}
