/**
 * Calendar Grid Component
 * 
 * The main calendar grid with month navigation and day cells.
 */

import { useState, useCallback } from 'react';
import { format, isSameMonth, addMonths, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarFilters, type CalendarFilterState } from './CalendarFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import type { CalendarTask } from './types';

const WEEKDAY_LABELS = {
  mobile: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  desktop: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

interface CalendarGridProps {
  currentMonth: Date;
  calendarDays: Date[];
  getTasksForDay: (date: Date) => CalendarTask[];
  selectedDate: Date | null;
  onMonthChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  onTaskReschedule: (taskId: string, newDate: string) => void;
  filters?: CalendarFilterState;
  onFiltersChange?: (filters: CalendarFilterState) => void;
  aquariums?: Array<{ id: string; name: string }>;
}

export function CalendarGrid({
  currentMonth,
  calendarDays,
  getTasksForDay,
  selectedDate,
  onMonthChange,
  onDayClick,
  onTaskReschedule,
  filters,
  onFiltersChange,
  aquariums,
}: CalendarGridProps) {
  const isMobile = useIsMobile();
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);
  const [direction, setDirection] = useState(0);

  const previousMonth = useCallback(() => {
    setDirection(-1);
    onMonthChange(subMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const nextMonth = useCallback(() => {
    setDirection(1);
    onMonthChange(addMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setDirection(today > currentMonth ? 1 : -1);
    onMonthChange(today);
  }, [currentMonth, onMonthChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((date: Date) => {
    if (!draggedTask) return;
    onTaskReschedule(draggedTask.id, format(date, 'yyyy-MM-dd'));
    setDraggedTask(null);
  }, [draggedTask, onTaskReschedule]);

  const weekdayLabels = isMobile ? WEEKDAY_LABELS.mobile : WEEKDAY_LABELS.desktop;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.h2
                key={format(currentMonth, 'yyyy-MM')}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={{ duration: 0.2 }}
                className="text-lg md:text-xl font-bold"
              >
                {format(currentMonth, 'MMMM yyyy')}
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation & Filters */}
        <div className="flex items-center gap-2">
          {filters && onFiltersChange && (
            <CalendarFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              aquariums={aquariums}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="hidden md:inline-flex h-8 px-3 text-xs"
          >
            Today
          </Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousMonth}
              className="h-8 w-8 rounded-none border-r"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8 rounded-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 md:p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {weekdayLabels.map((day, idx) => (
            <div
              key={`${day}-${idx}`}
              className="text-center text-xs md:text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentMonth, 'yyyy-MM')}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-7 gap-1 md:gap-2"
          >
            {calendarDays.map((day) => (
              <CalendarDayCell
                key={format(day, 'yyyy-MM-dd')}
                day={day}
                currentMonth={currentMonth}
                tasks={getTasksForDay(day)}
                isSelected={selectedDate ? isSameMonth(day, selectedDate) && day.getDate() === selectedDate.getDate() : false}
                isMobile={isMobile}
                onDayClick={onDayClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onTaskDragStart={setDraggedTask}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile: Today button */}
      {isMobile && (
        <div className="p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="w-full"
          >
            Go to Today
          </Button>
        </div>
      )}
    </motion.div>
  );
}
