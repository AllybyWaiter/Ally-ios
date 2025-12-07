import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, Plus, ListTodo, CheckCircle2, Pencil, Trash2, AlertCircle, Clock, CalendarClock } from "lucide-react";
import { format, isValid, isToday, isBefore, isAfter, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceTaskDialog } from "./MaintenanceTaskDialog";
import { formatRelativeTime } from "@/lib/formatters";

// Safe date formatter to prevent crashes
const safeFormatDate = (dateValue: string | null | undefined, formatStr: string = "PP"): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) return 'Invalid date';
    return format(date, formatStr);
  } catch (error) {
    console.error('Date formatting error in AquariumTasks:', error);
    return '';
  }
};

type TaskFilter = "all" | "overdue" | "today" | "upcoming";

interface AquariumTasksProps {
  aquariumId: string;
}

export const AquariumTasks = ({ aquariumId }: AquariumTasksProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", aquariumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("*")
        .eq("aquarium_id", aquariumId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleCreateTask = () => {
    setDialogMode("create");
    setEditingTaskId(undefined);
    setDialogOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setTimeout(() => {
      setDialogMode("edit");
      setEditingTaskId(taskId);
      setDialogOpen(true);
    }, 0);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from("maintenance_tasks")
        .delete()
        .eq("id", taskToDelete);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('tasks.taskDeleted'),
      });

      queryClient.invalidateQueries({ queryKey: ["tasks", aquariumId] });
      queryClient.invalidateQueries({ queryKey: ["upcomingTasks", aquariumId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTaskCount"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTaskToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!taskToComplete) return;

    try {
      // Get the task details first
      const { data: task } = await supabase
        .from("maintenance_tasks")
        .select("*, equipment_id")
        .eq("id", taskToComplete)
        .single();

      // Complete the current task
      const { error } = await supabase
        .from("maintenance_tasks")
        .update({
          status: "completed",
          completed_date: new Date().toISOString(),
        })
        .eq("id", taskToComplete);

      if (error) throw error;

      // If task has equipment with maintenance interval, create next occurrence
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

          toast({
            title: t('common.success'),
            description: t('tasks.taskCompletedAndNext'),
          });
        } else {
          toast({
            title: t('common.success'),
            description: t('tasks.taskMarkedComplete'),
          });
        }
      } else {
        toast({
          title: t('common.success'),
          description: t('tasks.taskMarkedComplete'),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["tasks", aquariumId] });
      queryClient.invalidateQueries({ queryKey: ["upcomingTasks", aquariumId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTaskCount"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTaskToComplete(null);
      setCompleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = startOfDay(new Date());
  
  const pendingTasks = tasks?.filter((t) => t.status === "pending") || [];
  const completedTasks = tasks?.filter((t) => t.status === "completed") || [];
  
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
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{task.task_name}</h4>
                        <Badge variant="secondary">{task.task_type || ''}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('tasks.due')} {safeFormatDate(task.due_date, 'PP')}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-muted-foreground">{task.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEditTask(task.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setTaskToDelete(task.id);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTaskToComplete(task.id);
                          setCompleteConfirmOpen(true);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t('tasks.complete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              <Card key={task.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{task.task_name}</h4>
                        <Badge variant="secondary">{task.task_type}</Badge>
                        <Badge variant="outline">{t('tasks.completed')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('tasks.completedDate')} {task.completed_date && formatRelativeTime(task.completed_date)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setTaskToDelete(task.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
