import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  equipment_type: z.string().min(1, "Equipment type is required"),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  install_date: z.string().optional(),
  maintenance_interval_days: z.coerce.number().min(1).max(365).optional(),
  last_maintenance_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  equipment?: any;
}

const EQUIPMENT_TYPES = [
  "Filter",
  "Heater",
  "Light",
  "Pump",
  "Protein Skimmer",
  "UV Sterilizer",
  "CO2 System",
  "Dosing Pump",
  "Wave Maker",
  "Chiller",
  "Other",
];

export const EquipmentDialog = ({
  open,
  onOpenChange,
  aquariumId,
  equipment,
}: EquipmentDialogProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!equipment;

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: equipment?.name || "",
      equipment_type: equipment?.equipment_type || "",
      brand: equipment?.brand || "",
      model: equipment?.model || "",
      install_date: equipment?.install_date || "",
      maintenance_interval_days: equipment?.maintenance_interval_days || undefined,
      last_maintenance_date: equipment?.last_maintenance_date || "",
      notes: equipment?.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: EquipmentFormValues) => {
      const data: any = {
        aquarium_id: aquariumId,
        name: values.name,
        equipment_type: values.equipment_type,
        brand: values.brand || null,
        model: values.model || null,
        install_date: values.install_date || null,
        maintenance_interval_days: values.maintenance_interval_days || null,
        last_maintenance_date: values.last_maintenance_date || null,
        notes: values.notes || null,
      };

      let equipmentId: string;

      if (isEditing) {
        const { error } = await supabase
          .from("equipment")
          .update(data)
          .eq("id", equipment.id);
        if (error) throw error;
        equipmentId = equipment.id;
      } else {
        const { data: newEquipment, error } = await supabase
          .from("equipment")
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        equipmentId = newEquipment.id;
      }

      // Create recurring maintenance task if interval is set
      if (values.maintenance_interval_days) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + values.maintenance_interval_days);

        await supabase.from("maintenance_tasks").insert({
          aquarium_id: aquariumId,
          equipment_id: equipmentId,
          task_name: `${values.name} Maintenance`,
          task_type: "equipment_maintenance",
          due_date: dueDate.toISOString().split("T")[0],
          status: "pending",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", aquariumId] });
      toast({
        title: isEditing ? "Equipment updated" : "Equipment added",
        description: `${form.getValues("name")} has been ${isEditing ? "updated" : "added"} successfully.`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: EquipmentFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Equipment" : "Add Equipment"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Canister Filter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fluval" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FX6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="install_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Install Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maintenance_interval_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Interval (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Days"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>Every X days</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_maintenance_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Maintenance (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditing ? "Update" : "Add"} Equipment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
