import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { gallonsToLiters, litersToGallons, getVolumeUnit } from "@/lib/unitConversions";

const aquariumSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  type: z.string().min(1, "Type is required"),
  volume_gallons: z.coerce.number().positive("Volume must be positive").optional().nullable(),
  status: z.enum(["active", "inactive", "maintenance"]),
  setup_date: z.date().optional().nullable(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional().nullable(),
});

type AquariumFormData = z.infer<typeof aquariumSchema>;

interface AquariumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  aquarium?: {
    id: string;
    name: string;
    type: string;
    volume_gallons: number | null;
    status: string;
    setup_date: string | null;
    notes: string | null;
  };
}

export function AquariumDialog({ open, onOpenChange, onSuccess, aquarium }: AquariumDialogProps) {
  const { units } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!aquarium;
  
  // Convert volume for display based on user preference
  const getDisplayVolume = (gallons: number | null) => {
    if (!gallons) return null;
    return units === 'metric' ? gallonsToLiters(gallons) : gallons;
  };

  const form = useForm<AquariumFormData>({
    resolver: zodResolver(aquariumSchema),
    defaultValues: {
      name: aquarium?.name || "",
      type: aquarium?.type || "",
      volume_gallons: getDisplayVolume(aquarium?.volume_gallons || null),
      status: (aquarium?.status as "active" | "inactive" | "maintenance") || "active",
      setup_date: aquarium?.setup_date ? new Date(aquarium.setup_date) : null,
      notes: aquarium?.notes || "",
    },
  });

  const onSubmit = async (data: AquariumFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Convert volume to gallons for storage if user entered in liters
      const volumeInGallons = data.volume_gallons && units === 'metric' 
        ? litersToGallons(data.volume_gallons)
        : data.volume_gallons;

      const aquariumData = {
        name: data.name,
        type: data.type,
        volume_gallons: volumeInGallons,
        status: data.status,
        setup_date: data.setup_date?.toISOString().split('T')[0] || null,
        notes: data.notes || null,
        user_id: user.id,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("aquariums")
          .update(aquariumData)
          .eq("id", aquarium.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Aquarium updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("aquariums")
          .insert([aquariumData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Aquarium created successfully",
        });
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving aquarium:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} aquarium`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Aquarium" : "Create New Aquarium"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update your aquarium details" : "Add a new aquarium to your collection"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Living Room Tank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select aquarium type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="freshwater">Freshwater</SelectItem>
                      <SelectItem value="saltwater">Saltwater</SelectItem>
                      <SelectItem value="reef">Reef</SelectItem>
                      <SelectItem value="planted">Planted</SelectItem>
                      <SelectItem value="brackish">Brackish</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="volume_gallons"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume ({getVolumeUnit(units)})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder={units === 'metric' ? 'e.g. 208' : 'e.g. 55'} 
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setup_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Setup Date</FormLabel>
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
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about your aquarium..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? "Update" : "Create"} Aquarium
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
