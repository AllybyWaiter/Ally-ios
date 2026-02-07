/**
 * Task Calendar Page
 * 
 * A beautifully redesigned calendar for managing aquarium maintenance tasks.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { queryKeys } from '@/lib/queryKeys';
import { SectionErrorBoundary } from '@/components/error-boundaries';
import { FeatureArea } from '@/lib/sentry';
import {
  CalendarHeroBanner,
  WeekAtGlance,
  CalendarGrid,
  CalendarTimeline,
  DayDetailPanel,
  QuickAddTaskFAB,
  useCalendarData,
  useCalendarKeyboard,
  type CalendarFilterState,
} from '@/components/calendar';
import { MaintenanceTaskDialog } from '@/components/aquarium/MaintenanceTaskDialog';

const DEFAULT_FILTERS: CalendarFilterState = {
  taskTypes: [],
  statuses: [],
  aquariumIds: [],
};

export default function TaskCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filters, setFilters] = useState<CalendarFilterState>(DEFAULT_FILTERS);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    isLoading,
    calendarDays,
    getTasksForDay,
    stats,
    aquariums,
    completeTask,
    rescheduleTask,
    isCompleting,
  } = useCalendarData({ currentMonth, filters });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('calendar-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_tasks',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error for calendar-tasks-changes');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const handleAddTask = useCallback(() => {
    setShowAddTask(true);
  }, []);

  const handleTaskReschedule = useCallback((taskId: string, newDate: string) => {
    rescheduleTask({ taskId, newDate });
  }, [rescheduleTask]);

  // Keyboard navigation
  useCalendarKeyboard({
    selectedDate,
    onDateChange: setSelectedDate,
    onOpenDay: () => selectedDate && setSelectedDate(selectedDate),
    onAddTask: handleAddTask,
    onGoToToday: () => setCurrentMonth(new Date()),
    onClose: handleCloseDetail,
  });

  const selectedDateTasks = selectedDate ? getTasksForDay(selectedDate) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6 pt-20 pb-24 md:pb-8 mt-safe max-w-7xl space-y-6">
        <SectionErrorBoundary fallbackTitle="Failed to load calendar" featureArea={FeatureArea.MAINTENANCE}>
          {/* Hero Banner */}
          <CalendarHeroBanner
            todayCount={stats.todayCount}
            overdueCount={stats.overdueCount}
            completedCount={stats.completedCount}
            thisWeekCount={stats.thisWeekCount}
          />

          {/* Stats Widget */}
          <WeekAtGlance
            todayCount={stats.todayCount}
            overdueCount={stats.overdueCount}
            thisWeekCount={stats.thisWeekCount}
            completedCount={stats.completedCount}
            totalPending={stats.totalPending}
            onAddTask={handleAddTask}
          />

          {/* Calendar Grid */}
          <CalendarGrid
            currentMonth={currentMonth}
            calendarDays={calendarDays}
            getTasksForDay={getTasksForDay}
            selectedDate={selectedDate}
            onMonthChange={setCurrentMonth}
            onDayClick={handleDayClick}
            onTaskReschedule={handleTaskReschedule}
            filters={filters}
            onFiltersChange={setFilters}
            aquariums={aquariums}
          />

          {/* Today's Timeline */}
          <CalendarTimeline
            tasks={stats.todayTasks || []}
            onCompleteTask={completeTask}
          />
        </SectionErrorBoundary>
      </main>

      {/* Day Detail Panel */}
      <DayDetailPanel
        selectedDate={selectedDate}
        tasks={selectedDateTasks}
        onClose={handleCloseDetail}
        onCompleteTask={completeTask}
        onAddTask={handleAddTask}
        isCompleting={isCompleting}
      />

      {/* Quick Add FAB */}
      <QuickAddTaskFAB onClick={handleAddTask} />

      {/* Add Task Dialog - reuse existing */}
      <MaintenanceTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        aquariumId=""
        mode="create"
      />
    </div>
  );
}
