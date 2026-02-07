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
import type { CalendarFilterState } from '../CalendarFilters';

interface UseCalendarDataOptions {
  currentMonth: Date;
  filters?: CalendarFilterState;
}

export function useCalendarData({ currentMonth, filters }: UseCalendarDataOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tasks for the current month
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: queryKeys.tasks.calendar(format(currentMonth, 'yyyy-MM')),
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
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

  // Filter tasks based on filter state
  const filteredTasks = useMemo(() => {
    if (!filters) return tasks;
    
    return tasks.filter(task => {
      // Task type filter
      if (filters.taskTypes.length > 0 && !filters.taskTypes.includes(task.task_type)) {
        return false;
      }
      
      // Status filter (pending, completed, overdue)
      if (filters.statuses.length > 0) {
        const today = startOfDay(new Date());
        const taskDate = new Date(task.due_date);
        const isOverdue = task.status === 'pending' && isBefore(taskDate, today) && !isSameDay(taskDate, today);
        
        const matchesStatus = filters.statuses.some(status => {
          if (status === 'overdue') return isOverdue;
          return task.status === status;
        });
        
        if (!matchesStatus) return false;
      }
      
      // Aquarium filter
      if (filters.aquariumIds.length > 0 && !filters.aquariumIds.includes(task.aquarium_id)) {
        return false;
      }
      
      return true;
    });
  }, [tasks, filters]);

  // Tasks grouped by date for O(1) lookup
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    filteredTasks.forEach((task) => {
      const dateKey = task.due_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [filteredTasks]);

  // Get tasks for a specific day
  const getTasksForDay = useCallback((date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  }, [tasksByDate]);

  // Get unique aquariums from tasks
  const aquariums = useMemo(() => {
    const aquariumMap = new Map<string, { id: string; name: string }>();
    tasks.forEach(task => {
      if (task.aquarium && !aquariumMap.has(task.aquarium_id)) {
        aquariumMap.set(task.aquarium_id, { 
          id: task.aquarium.id, 
          name: task.aquarium.name 
        });
      }
    });
    return Array.from(aquariumMap.values());
  }, [tasks]);

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
    filteredTasks,
    isLoading,
    error,
    calendarDays,
    tasksByDate,
    getTasksForDay,
    stats,
    aquariums,
    completeTask: completeTaskMutation.mutate,
    rescheduleTask: rescheduleTaskMutation.mutate,
    isCompleting: completeTaskMutation.isPending,
    isRescheduling: rescheduleTaskMutation.isPending,
    invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  };
}
