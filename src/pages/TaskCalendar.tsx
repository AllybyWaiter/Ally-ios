import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import { queryKeys } from "@/lib/queryKeys";
import { queryPresets } from "@/lib/queryConfig";
import { SectionErrorBoundary } from "@/components/error-boundaries";
import { FeatureArea } from "@/lib/sentry";

interface Task {
  id: string;
  task_name: string;
  task_type: string;
  due_date: string;
  status: string;
  aquarium_id: string;
  aquarium?: {
    name: string;
  };
}

const TASK_TYPE_COLORS: Record<string, string> = {
  water_change: "bg-blue-500",
  filter_maintenance: "bg-purple-500",
  equipment_maintenance: "bg-orange-500",
  testing: "bg-green-500",
  feeding: "bg-yellow-500",
  cleaning: "bg-cyan-500",
  other: "bg-gray-500",
};

export default function TaskCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: queryKeys.tasks.calendar(format(currentMonth, "yyyy-MM")),
    queryFn: async () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data: aquariums } = await supabase
        .from("aquariums")
        .select("id");

      if (!aquariums || aquariums.length === 0) return [];

      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
          *,
          aquarium:aquariums(name)
        `)
        .gte("due_date", monthStart.toISOString().split("T")[0])
        .lte("due_date", monthEnd.toISOString().split("T")[0])
        .eq("status", "pending")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    ...queryPresets.tasks,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("maintenance-tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maintenance_tasks",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Memoize calendar grid computation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Memoize tasks grouped by date for O(1) lookup
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks?.forEach((task) => {
      const dateKey = task.due_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [tasks]);

  const getTasksForDay = useCallback((date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return tasksByDate.get(dateKey) || [];
  }, [tasksByDate]);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date) => {
    if (!draggedTask) return;

    const newDate = format(date, "yyyy-MM-dd");
    
    try {
      const { error } = await supabase
        .from("maintenance_tasks")
        .update({ due_date: newDate })
        .eq("id", draggedTask.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task rescheduled successfully",
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDraggedTask(null);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 pt-24 mt-safe max-w-7xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-8 h-8" />
                Task Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-[180px] text-center font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </div>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SectionErrorBoundary fallbackTitle="Failed to load calendar grid" featureArea={FeatureArea.MAINTENANCE}>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-sm p-2 text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day) => {
                  const dayTasks = getTasksForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] p-2 border rounded-lg transition-colors ${
                        isCurrentMonth ? "bg-card" : "bg-muted/30"
                      } ${isToday ? "ring-2 ring-primary" : ""}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day)}
                    >
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                        } ${isToday ? "text-primary" : ""}`}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => handleDragStart(task)}
                            className={`text-xs p-1.5 rounded cursor-move hover:opacity-80 transition-opacity ${
                              TASK_TYPE_COLORS[task.task_type] || TASK_TYPE_COLORS.other
                            } text-white`}
                            title={`${task.task_name} - ${task.aquarium?.name || "Unknown"}`}
                          >
                            <div className="font-semibold truncate">
                              {task.task_name}
                            </div>
                            <div className="truncate opacity-90">
                              {task.aquarium?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionErrorBoundary>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-3">Task Types</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(TASK_TYPE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${color}`}></div>
                    <span className="text-sm capitalize">
                      {type.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
