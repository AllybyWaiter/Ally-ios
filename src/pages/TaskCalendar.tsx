import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, Check, ArrowRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import { queryKeys } from "@/lib/queryKeys";
import { queryPresets } from "@/lib/queryConfig";
import { SectionErrorBoundary } from "@/components/error-boundaries";
import { FeatureArea } from "@/lib/sentry";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";

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
  water_change: "bg-primary",
  filter_maintenance: "bg-purple-500",
  equipment_maintenance: "bg-orange-500",
  testing: "bg-green-500",
  feeding: "bg-yellow-500",
  cleaning: "bg-secondary",
  other: "bg-gray-500",
};

const TASK_TYPE_DOT_COLORS: Record<string, string> = {
  water_change: "bg-primary",
  filter_maintenance: "bg-purple-500",
  equipment_maintenance: "bg-orange-500",
  testing: "bg-green-500",
  feeding: "bg-yellow-500",
  cleaning: "bg-secondary",
  other: "bg-gray-500",
};

export default function TaskCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { data: tasks, isLoading } = useQuery({
    queryKey: queryKeys.tasks.calendar(format(currentMonth, "yyyy-MM")),
    queryFn: async () => {
      // Get current user to filter tasks to only their aquariums
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Explicitly filter aquariums by user_id (not relying on RLS alone)
      const { data: aquariums } = await supabase
        .from("aquariums")
        .select("id")
        .eq("user_id", user.id);

      if (!aquariums || aquariums.length === 0) return [];

      const aquariumIds = aquariums.map(a => a.id);

      // Filter tasks to only those belonging to user's aquariums
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
          *,
          aquarium:aquariums(name)
        `)
        .in("aquarium_id", aquariumIds)
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

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return getTasksForDay(selectedDate);
  }, [selectedDate, getTasksForDay]);

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
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to reschedule task',
        variant: "destructive",
      });
    } finally {
      setDraggedTask(null);
    }
  };

  const handleDayClick = (date: Date) => {
    if (isMobile) {
      setSelectedDate(date);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("maintenance_tasks")
        .update({ 
          status: "completed",
          completed_date: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Task completed",
        description: "Great job keeping up with maintenance!",
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to complete task',
        variant: "destructive",
      });
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
      <main className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe max-w-7xl">
        <Card>
          <CardHeader className="pb-4">
            {/* Responsive Header - stacked on mobile */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 md:w-8 md:h-8" />
                Task Calendar
              </CardTitle>
              
              {/* Navigation Controls */}
              <div className="flex items-center justify-between md:justify-end gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={previousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-[120px] md:min-w-[180px] text-center font-semibold text-sm md:text-base">
                    {format(currentMonth, "MMM yyyy")}
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <SectionErrorBoundary fallbackTitle="Failed to load calendar grid" featureArea={FeatureArea.MAINTENANCE}>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {/* Day Headers - abbreviated on mobile */}
                {(isMobile ? ["S", "M", "T", "W", "T", "F", "S"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day, idx) => (
                  <div
                    key={`${day}-${idx}`}
                    className="text-center font-semibold text-xs md:text-sm p-1 md:p-2 text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day) => {
                  const dayTasks = getTasksForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <div
                      key={format(day, 'yyyy-MM-dd')}
                      onClick={() => handleDayClick(day)}
                      className={`
                        min-h-[48px] md:min-h-[120px] p-1 md:p-2 border rounded-lg transition-all
                        ${isCurrentMonth ? "bg-card" : "bg-muted/30"}
                        ${isToday ? "ring-2 ring-primary" : ""}
                        ${isSelected ? "ring-2 ring-primary/50 bg-primary/5" : ""}
                        ${isMobile ? "cursor-pointer active:bg-muted/50" : ""}
                        ${dayTasks.length > 0 && isMobile ? "hover:bg-muted/40" : ""}
                      `}
                      onDragOver={!isMobile ? handleDragOver : undefined}
                      onDrop={!isMobile ? () => handleDrop(day) : undefined}
                    >
                      {/* Day Number */}
                      <div
                        className={`
                          text-xs md:text-sm font-semibold mb-0.5 md:mb-1
                          ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}
                          ${isToday ? "text-primary" : ""}
                        `}
                      >
                        {format(day, "d")}
                      </div>

                      {/* Mobile: Show colored dots */}
                      {isMobile && dayTasks.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {dayTasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              className={`w-2 h-2 rounded-full ${TASK_TYPE_DOT_COLORS[task.task_type] || TASK_TYPE_DOT_COLORS.other}`}
                            />
                          ))}
                          {dayTasks.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Desktop: Show full task cards */}
                      {!isMobile && (
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
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionErrorBoundary>

            {/* Legend - Collapsible on mobile */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
              {isMobile ? (
                <Collapsible open={legendOpen} onOpenChange={setLegendOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span className="text-sm font-semibold">Task Types</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${legendOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(TASK_TYPE_COLORS).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          <span className="text-xs capitalize">
                            {type.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Day Detail Sheet */}
        <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
          <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {selectedDate && format(selectedDate, "EEEE, MMMM d")}
              </SheetTitle>
              <SheetDescription>
                {selectedDateTasks.length === 0 
                  ? "No tasks scheduled" 
                  : `${selectedDateTasks.length} task${selectedDateTasks.length !== 1 ? 's' : ''} scheduled`
                }
              </SheetDescription>
            </SheetHeader>

            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tasks for this day</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    {/* Task Type Indicator */}
                    <div className={`w-1 h-12 rounded-full ${TASK_TYPE_COLORS[task.task_type] || TASK_TYPE_COLORS.other}`} />
                    
                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.task_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {task.aquarium?.name || "Unknown aquarium"}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs capitalize">
                        {task.task_type.replace("_", " ")}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => navigate(`/aquarium/${task.aquarium_id}`)}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
