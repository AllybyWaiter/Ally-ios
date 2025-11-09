import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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

const taskTypes = [
  { value: "water_change", label: "Water Change" },
  { value: "filter_cleaning", label: "Filter Cleaning" },
  { value: "equipment_maintenance", label: "Equipment Maintenance" },
  { value: "feeding", label: "Feeding" },
  { value: "dosing", label: "Dosing" },
  { value: "testing", label: "Testing" },
  { value: "other", label: "Other" },
] as const;

const formSchema = z.object({
  task_name: z.string().min(1, "Task name is required"),
  task_type: z.string().min(1, "Task type is required"),
  due_date: z.date({
    required_error: "Due date is required",
  }),
  equipment_id: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MaintenanceTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  taskId?: string;
  mode?: "create" | "edit";
}

export const MaintenanceTaskDialog = ({
  open,
  onOpenChange,
  aquariumId,
  taskId,
  mode = "create",
}: MaintenanceTaskDialogProps) => {
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
    },
  });

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
          .select("*")
          .eq("id", taskId)
          .single();

        if (data) {
          form.reset({
            task_name: data.task_name,
            task_type: data.task_type,
            due_date: new Date(data.due_date),
            equipment_id: data.equipment_id || "",
            notes: data.notes || "",
          });
        }
      }
    };
    if (open) {
      loadTask();
    }
  }, [mode, taskId, open, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const taskData = {
        aquarium_id: aquariumId,
        task_name: values.task_name,
        task_type: values.task_type,
        due_date: format(values.due_date, "yyyy-MM-dd"),
        equipment_id: values.equipment_id || null,
        notes: values.notes || null,
      };

      if (mode === "create") {
        const { error } = await supabase
          .from("maintenance_tasks")
          .insert({ ...taskData, status: "pending" });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task created successfully",
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
