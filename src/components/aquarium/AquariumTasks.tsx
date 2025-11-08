import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Loader2, Plus, ListTodo, CheckCircle2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceTaskDialog } from "./MaintenanceTaskDialog";

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
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    setDialogMode("edit");
    setEditingTaskId(taskId);
    setDialogOpen(true);
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
        title: "Success",
        description: "Task deleted successfully",
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
            title: "Success",
            description: "Task completed and next occurrence created",
          });
        } else {
          toast({
            title: "Success",
            description: "Task marked as complete",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Task marked as complete",
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

  const pendingTasks = tasks?.filter((t) => t.status === "pending") || [];
  const completedTasks = tasks?.filter((t) => t.status === "completed") || [];

  if (!tasks || tasks.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <ListTodo className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create maintenance tasks to keep your aquarium in top condition
            </p>
            <Button onClick={handleCreateTask}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Maintenance Tasks</h2>
          <Button onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>

      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            Pending ({pendingTasks.length})
          </h3>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{task.task_name}</h4>
                        <Badge variant="secondary">{task.task_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Due: {format(new Date(task.due_date), "PPP")}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-muted-foreground">{task.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToComplete(task.id);
                          setCompleteConfirmOpen(true);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTask(task.id)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setTaskToDelete(task.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Completed ({completedTasks.length})
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
                        <Badge variant="outline">Completed</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Completed: {task.completed_date && format(new Date(task.completed_date), "PPP")}
                      </p>
                    </div>
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
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this task as complete?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteTask}>
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
