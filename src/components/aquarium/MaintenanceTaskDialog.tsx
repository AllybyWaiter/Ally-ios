import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { getTaskTypes } from "@/lib/waterBodyUtils";

const formSchema = z.object({
  task_name: z.string().min(1, "Task name is required"),
  task_type: z.string().min(1, "Task type is required"),
  due_date: z.date({
    required_error: "Due date is required",
  }),
  equipment_id: z.string().optional(),
  notes: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']).optional(),
  recurrence_days: z.number().min(1).optional(),
}).refine((data) => {
  // If recurring with custom interval, recurrence_days is required
  if (data.is_recurring && data.recurrence_interval === 'custom') {
    return data.recurrence_days != null && data.recurrence_days > 0;
  }
  return true;
}, {
  message: "Custom interval requires number of days",
  path: ["recurrence_days"],
});

type FormValues = z.infer<typeof formSchema>;

interface MaintenanceTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  aquariumType?: string;
  taskId?: string;
  mode?: "create" | "edit";
}

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily', days: 1 },
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Every 2 Weeks', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'custom', label: 'Custom...', days: null },
];

export const MaintenanceTaskDialog = ({
  open,
  onOpenChange,
  aquariumId,
  aquariumType = 'freshwater',
  taskId,
  mode = "create",
}: MaintenanceTaskDialogProps) => {
  const taskTypes = getTaskTypes(aquariumType);
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Array<{ id: string; name: string; equipment_type: string }>>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      task_name: "",
      task_type: "",
      due_date: new Date(),
      equipment_id: "",
      notes: "",
      is_recurring: false,
      recurrence_interval: undefined,
      recurrence_days: undefined,
    },
  });

  const isRecurring = form.watch("is_recurring");
  const recurrenceInterval = form.watch("recurrence_interval");

  // Load equipment for the aquarium
  useEffect(() => {
    const loadEquipment = async () => {
      const { data } = await supabase
        .from("equipment")
        .select("id, name, equipment_type")
        .eq("aquarium_id", aquariumId);
      setEquipment(data || []);
    };
    if (open) {
      loadEquipment();
    }
  }, [aquariumId, open]);

  // Auto-associate equipment based on task type
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "task_type" && value.task_type && equipment.length > 0) {
        const taskType = value.task_type;

        // Mapping of task types to equipment types
        const taskToEquipmentMap: Record<string, string[]> = {
          filter_cleaning: ["Filter"],
          dosing: ["Dosing Pump"],
          equipment_maintenance: [], // Will show all equipment
        };

        const matchingTypes = taskToEquipmentMap[taskType];
        if (!matchingTypes) return;

        // Find equipment matching the task type
        const matchingEquipment = equipment.filter((item) =>
          matchingTypes.some((type) => item.equipment_type?.includes(type))
        );

        // Auto-select if there's exactly one match
        if (matchingEquipment.length === 1) {
          form.setValue("equipment_id", matchingEquipment[0].id);
        } else if (matchingEquipment.length === 0 && matchingTypes.length > 0) {
          // Clear selection if no match for specific task types
          form.setValue("equipment_id", "");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [equipment, form]);

  // Load task data if editing
  useEffect(() => {
    const loadTask = async () => {
      if (mode === "edit" && taskId) {
        const { data } = await supabase
          .from("maintenance_tasks")
          .select("*, aquariums!inner(user_id)")
          .eq("id", taskId)
          .eq("aquariums.user_id", (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (data) {
          form.reset({
            task_name: data.task_name,
            task_type: data.task_type,
            due_date: new Date(data.due_date),
            equipment_id: data.equipment_id || "",
            notes: data.notes || "",
            is_recurring: data.is_recurring || false,
            recurrence_interval: data.recurrence_interval as FormValues['recurrence_interval'] || undefined,
            recurrence_days: data.recurrence_days || undefined,
          });
        }
      }
    };
    if (open) {
      loadTask();
    }
  }, [mode, taskId, open, form]);

  // Reset recurrence fields when recurring is toggled off
  useEffect(() => {
    if (!isRecurring) {
      form.setValue("recurrence_interval", undefined);
      form.setValue("recurrence_days", undefined);
    }
  }, [isRecurring, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // iOS PWA fix: Try to get session first, refresh if stale
      const { data: sessionData } = await supabase.auth.getSession();
      let currentUser = sessionData.session?.user;
      
      if (!currentUser) {
        // Try refreshing the session once (handles iOS PWA stale sessions)
        const { data: refreshData } = await supabase.auth.refreshSession();
        currentUser = refreshData.session?.user;
      }
      
      if (!currentUser) {
        throw new Error("Session expired. Please sign in again.");
      }

      // Calculate recurrence_days for non-custom intervals
      let recurrenceDays = values.recurrence_days;
      if (values.is_recurring && values.recurrence_interval && values.recurrence_interval !== 'custom') {
        const option = RECURRENCE_OPTIONS.find(o => o.value === values.recurrence_interval);
        recurrenceDays = option?.days || undefined;
      }

      const taskData = {
        aquarium_id: aquariumId,
        task_name: values.task_name,
        task_type: values.task_type,
        due_date: format(values.due_date, "yyyy-MM-dd"),
        equipment_id: values.equipment_id || null,
        notes: values.notes || null,
        is_recurring: values.is_recurring,
        recurrence_interval: values.is_recurring ? values.recurrence_interval : null,
        recurrence_days: values.is_recurring ? recurrenceDays : null,
      };

      if (mode === "create") {
        const { error } = await supabase
          .from("maintenance_tasks")
          .insert({ ...taskData, status: "pending" });

        if (error) throw error;

        toast({
          title: "Success",
          description: values.is_recurring 
            ? `Recurring task created (${getRecurrenceLabel(values.recurrence_interval, recurrenceDays)})`
            : "Task created successfully",
        });
      } else if (mode === "edit" && taskId) {
        const { error } = await supabase
          .from("maintenance_tasks")
          .update(taskData)
          .eq("id", taskId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["tasks", aquariumId] });
      queryClient.invalidateQueries({ queryKey: ["upcomingTasks", aquariumId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTaskCount"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save task";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecurrenceLabel = (interval?: string, days?: number): string => {
    if (!interval) return '';
    if (interval === 'custom' && days) return `every ${days} days`;
    const option = RECURRENCE_OPTIONS.find(o => o.value === interval);
    return option?.label.toLowerCase() || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new maintenance task for your aquarium"
              : "Update the maintenance task details"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="task_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekly water change" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="task_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Task Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Repeat className="w-4 h-4" />
                        Repeat this task
                      </FormLabel>
                      <FormDescription>
                        Automatically create next occurrence when completed
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <>
                  <FormField
                    control={form.control}
                    name="recurrence_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RECURRENCE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {recurrenceInterval === 'custom' && (
                    <FormField
                      control={form.control}
                      name="recurrence_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repeat every (days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              placeholder="e.g., 3"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </div>

            {equipment.length > 0 && (
              <FormField
                control={form.control}
                name="equipment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Equipment (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {equipment.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.equipment_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Task" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};