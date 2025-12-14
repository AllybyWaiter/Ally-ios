import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, ListTodo, CheckCircle2, AlertCircle, Clock, CalendarClock } from "lucide-react";
import { isToday, isBefore, isAfter, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceTaskDialog } from "./MaintenanceTaskDialog";
import { queryKeys } from "@/lib/queryKeys";
import { fetchTasks, deleteTask, completeTask, type MaintenanceTask } from "@/infrastructure/queries";
import { PendingTaskCard, CompletedTaskCard } from "./TaskCard";

// Type alias for task filter

type TaskFilter = "all" | "overdue" | "today" | "upcoming";

interface AquariumTasksProps {
  aquariumId: string;
}

export const AquariumTasks = ({ aquariumId }: AquariumTasksProps) => {
  const { user, loading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");
  
  // Fallback timer to prevent auth loading from blocking indefinitely
  const [authFallbackReady, setAuthFallbackReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthFallbackReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Use fallback if auth loading takes too long
  const effectiveAuthLoading = authLoading && !authFallbackReady;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: queryKeys.tasks.list(aquariumId),
    queryFn: async () => {
      // iOS PWA fix: Refresh session if stale before fetching
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await supabase.auth.refreshSession();
      }
      return fetchTasks(aquariumId);
    },
    enabled: !effectiveAuthLoading && !!user && !!aquariumId,
    staleTime: 10000,
    retry: 2,
  });

  const handleCreateTask = () => {
    setDialogMode("create");
    setEditingTaskId(undefined);
    setDialogOpen(true);
  };

  const handleEditTask = useCallback((taskId: string) => {
    setTimeout(() => {
      setDialogMode("edit");
      setEditingTaskId(taskId);
      setDialogOpen(true);
    }, 0);
  }, []);

  const handleDeleteClick = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleCompleteClick = useCallback((taskId: string) => {
    setTaskToComplete(taskId);
    setCompleteConfirmOpen(true);
  }, []);

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list(aquariumId) });
      const previousTasks = queryClient.getQueryData<MaintenanceTask[]>(queryKeys.tasks.list(aquariumId));
      
      queryClient.setQueryData(
        queryKeys.tasks.list(aquariumId),
        (old: MaintenanceTask[] | undefined) => old?.filter((t) => t.id !== taskId) ?? []
      );
      
      return { previousTasks };
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('tasks.taskDeleted'),
      });
    },
    onError: (error: any, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(aquariumId), context.previousTasks);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(aquariumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.upcomingForAquarium(aquariumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dashboardCount });
    },
  });

  // Complete mutation with optimistic updates
  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Get task details for potential recurring task creation
      const { data: task } = await supabase
        .from("maintenance_tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      // Complete the task
      await completeTask(taskId);

      // Handle task-level recurring tasks first
      if (task?.is_recurring && task?.recurrence_days) {
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + task.recurrence_days);

        await supabase.from("maintenance_tasks").insert({
          aquarium_id: aquariumId,
          equipment_id: task.equipment_id,
          task_name: task.task_name,
          task_type: task.task_type,
          due_date: nextDueDate.toISOString().split("T")[0],
          status: "pending",
          notes: task.notes,
          is_recurring: true,
          recurrence_interval: task.recurrence_interval,
          recurrence_days: task.recurrence_days,
        });

        return { hasNextTask: true, isRecurring: true };
      }

      // Fall back to equipment-based recurring tasks
      if (task?.equipment_id) {
        const { data: equipment } = await supabase
          .from("equipment")
          .select("maintenance_interval_days, name")
          .eq("id", task.equipment_id)
          .single();

        if (equipment?.maintenance_interval_days) {
          const nextDueDate = new Date();
          nextDueDate.setDate(nextDueDate.getDate() + equipment.maintenance_interval_days);

          await supabase.from("maintenance_tasks").insert({
            aquarium_id: aquariumId,
            equipment_id: task.equipment_id,
            task_name: task.task_name,
            task_type: task.task_type,
            due_date: nextDueDate.toISOString().split("T")[0],
            status: "pending",
          });

          return { hasNextTask: true, isRecurring: false };
        }
      }
      return { hasNextTask: false, isRecurring: false };
    },
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list(aquariumId) });
      const previousTasks = queryClient.getQueryData<MaintenanceTask[]>(queryKeys.tasks.list(aquariumId));
      
      // Optimistically mark as completed
      queryClient.setQueryData(
        queryKeys.tasks.list(aquariumId),
        (old: MaintenanceTask[] | undefined) => 
          old?.map((t) => 
            t.id === taskId 
              ? { ...t, status: 'completed', completed_date: new Date().toISOString() } 
              : t
          ) ?? []
      );
      
      return { previousTasks };
    },
    onSuccess: (result) => {
      toast({
        title: t('common.success'),
        description: result?.hasNextTask ? t('tasks.taskCompletedAndNext') : t('tasks.taskMarkedComplete'),
      });
    },
    onError: (error: any, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(aquariumId), context.previousTasks);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(aquariumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.upcomingForAquarium(aquariumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dashboardCount });
    },
  });

  const handleDeleteTask = useCallback(() => {
    if (!taskToDelete) return;
    deleteMutation.mutate(taskToDelete, {
      onSettled: () => {
        setTaskToDelete(null);
        setDeleteConfirmOpen(false);
      },
    });
  }, [taskToDelete, deleteMutation]);

  const handleCompleteTask = useCallback(() => {
    if (!taskToComplete) return;
    completeMutation.mutate(taskToComplete, {
      onSettled: () => {
        setTaskToComplete(null);
        setCompleteConfirmOpen(false);
      },
    });
  }, [taskToComplete, completeMutation]);

  // All hooks MUST be called before any early returns (React Rules of Hooks)
  const today = useMemo(() => startOfDay(new Date()), []);
  
  const pendingTasks = useMemo(
    () => tasks?.filter((t) => t.status === "pending") || [],
    [tasks]
  );
  
  const completedTasks = useMemo(
    () => tasks?.filter((t) => t.status === "completed") || [],
    [tasks]
  );
  
  // Filter pending tasks based on selected filter
  const filteredPendingTasks = useMemo(() => {
    if (filter === "all") return pendingTasks;
    
    return pendingTasks.filter((task) => {
      if (!task.due_date) return false;
      const dueDate = startOfDay(new Date(task.due_date));
      
      switch (filter) {
        case "overdue":
          return isBefore(dueDate, today);
        case "today":
          return isToday(dueDate);
        case "upcoming":
          return isAfter(dueDate, today);
        default:
          return true;
      }
    });
  }, [pendingTasks, filter, today]);
  
  // Count tasks by category for filter badges
  const taskCounts = useMemo(() => {
    const counts = { all: pendingTasks.length, overdue: 0, today: 0, upcoming: 0 };
    pendingTasks.forEach((task) => {
      if (!task.due_date) return;
      const dueDate = startOfDay(new Date(task.due_date));
      if (isBefore(dueDate, today)) counts.overdue++;
      else if (isToday(dueDate)) counts.today++;
      else if (isAfter(dueDate, today)) counts.upcoming++;
    });
    return counts;
  }, [pendingTasks, today]);

  // Show loading while auth is initializing or data is loading (AFTER all hooks)
  if (effectiveAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <ListTodo className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('tasks.noTasksYet')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('tasks.createTasksMessage')}
            </p>
            <Button onClick={handleCreateTask}>
              <Plus className="w-4 h-4 mr-2" />
              {t('tasks.createTask')}
            </Button>
          </CardContent>
        </Card>
        <MaintenanceTaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          aquariumId={aquariumId}
          taskId={editingTaskId}
          mode={dialogMode}
        />
      </>
    );
  }

  return (
      <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">{t('tasks.title')}</h2>
          <Button onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            {t('tasks.createTask')}
          </Button>
        </div>

        {/* Task Filter */}
        {pendingTasks.length > 0 && (
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => value && setFilter(value as TaskFilter)}
            className="justify-start flex-wrap"
          >
            <ToggleGroupItem value="all" aria-label="All tasks" className="gap-1.5">
              <ListTodo className="w-4 h-4" />
              {t('tasks.filterAll')}
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {taskCounts.all}
              </Badge>
            </ToggleGroupItem>
            <ToggleGroupItem value="overdue" aria-label="Overdue tasks" className="gap-1.5">
              <AlertCircle className="w-4 h-4 text-destructive" />
              {t('tasks.filterOverdue')}
              {taskCounts.overdue > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {taskCounts.overdue}
                </Badge>
              )}
            </ToggleGroupItem>
            <ToggleGroupItem value="today" aria-label="Due today" className="gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              {t('tasks.filterToday')}
              {taskCounts.today > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs">
                  {taskCounts.today}
                </Badge>
              )}
            </ToggleGroupItem>
            <ToggleGroupItem value="upcoming" aria-label="Upcoming tasks" className="gap-1.5">
              <CalendarClock className="w-4 h-4" />
              {t('tasks.filterUpcoming')}
              {taskCounts.upcoming > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                  {taskCounts.upcoming}
                </Badge>
              )}
            </ToggleGroupItem>
          </ToggleGroup>
        )}

      {filteredPendingTasks.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            {t('tasks.pending')} ({filteredPendingTasks.length})
          </h3>
          <div className="space-y-3">
            {filteredPendingTasks.map((task) => (
              <PendingTaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteClick}
                onComplete={handleCompleteClick}
              />
            ))}
          </div>
        </div>
      ) : filter !== "all" && pendingTasks.length > 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t('tasks.noTasksMatchFilter')}</p>
          </CardContent>
        </Card>
      ) : null}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {t('tasks.completed')} ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <CompletedTaskCard
                key={task.id}
                task={task}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </div>
      )}
      </div>

      <MaintenanceTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aquariumId={aquariumId}
        taskId={editingTaskId}
        mode={dialogMode}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.deleteTask')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.completeTask')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.completeConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteTask}>
              {t('tasks.complete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
