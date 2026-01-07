/**
 * Calendar Data Hook
 * 
 * Centralized data fetching and management for the calendar.
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';
import { queryPresets } from '@/lib/queryConfig';
import { useToast } from '@/hooks/use-toast';
import type { CalendarTask } from '../types';

interface UseCalendarDataOptions {
  currentMonth: Date;
}

export function useCalendarData({ currentMonth }: UseCalendarDataOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tasks for the current month
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: queryKeys.tasks.calendar(format(currentMonth, 'yyyy-MM')),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Get user's aquariums first
      const { data: aquariums } = await supabase
        .from('aquariums')
        .select('id')
        .eq('user_id', user.id);

      if (!aquariums || aquariums.length === 0) return [];

      const aquariumIds = aquariums.map(a => a.id);

      // Fetch all tasks (both pending and completed for the month view)
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          aquarium:aquariums(id, name, type)
        `)
        .in('aquarium_id', aquariumIds)
        .gte('due_date', monthStart.toISOString().split('T')[0])
        .lte('due_date', monthEnd.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as CalendarTask[];
    },
    ...queryPresets.tasks,
  });

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Tasks grouped by date for O(1) lookup
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    tasks.forEach((task) => {
      const dateKey = task.due_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [tasks]);

  // Get tasks for a specific day
  const getTasksForDay = useCallback((date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  }, [tasksByDate]);

  // Stats calculations
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const todayTasks = pendingTasks.filter(t => 
      isSameDay(new Date(t.due_date), today)
    );
    
    const overdueTasks = pendingTasks.filter(t => 
      isBefore(new Date(t.due_date), today) && !isSameDay(new Date(t.due_date), today)
    );

    const thisWeekTasks = pendingTasks.filter(t => {
      const taskDate = new Date(t.due_date);
      const weekEnd = endOfWeek(today);
      return !isBefore(taskDate, today) && !isBefore(weekEnd, taskDate);
    });

    return {
      todayCount: todayTasks.length,
      todayTasks,
      overdueCount: overdueTasks.length,
      overdueTasks,
      thisWeekCount: thisWeekTasks.length,
      thisWeekTasks,
      completedCount: completedTasks.length,
      totalPending: pendingTasks.length,
    };
  }, [tasks]);

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('maintenance_tasks')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Task completed',
        description: 'Great job keeping up with maintenance!',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete task',
        variant: 'destructive',
      });
    },
  });

  // Reschedule task mutation
  const rescheduleTaskMutation = useMutation({
    mutationFn: async ({ taskId, newDate }: { taskId: string; newDate: string }) => {
      const { error } = await supabase
        .from('maintenance_tasks')
        .update({ due_date: newDate })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Task rescheduled',
        description: 'Task moved to new date',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reschedule task',
        variant: 'destructive',
      });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    calendarDays,
    tasksByDate,
    getTasksForDay,
    stats,
    completeTask: completeTaskMutation.mutate,
    rescheduleTask: rescheduleTaskMutation.mutate,
    isCompleting: completeTaskMutation.isPending,
    isRescheduling: rescheduleTaskMutation.isPending,
    invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  };
}
