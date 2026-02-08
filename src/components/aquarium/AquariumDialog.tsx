import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, MapPin, Check, X, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import { gallonsToLiters, litersToGallons, getVolumeUnit } from "@/lib/unitConversions";
import { useLocationDetection } from "@/hooks/useLocationDetection";

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
    latitude?: number | null;
    longitude?: number | null;
    location_name?: string | null;
  };
}

export function AquariumDialog({ open, onOpenChange, onSuccess, aquarium }: AquariumDialogProps) {
  const { units } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!aquarium;
  
  // Location detection for new aquariums
  const { latitude, longitude, locationName, loading: locationLoading, detectLocation, clearDetectedLocation } = useLocationDetection();
  const [locationConfirmed, setLocationConfirmed] = useState<boolean | null>(null);
  const [locationDetectionAttempted, setLocationDetectionAttempted] = useState(false);

  // Auto-detect location when dialog opens for new aquarium
  useEffect(() => {
    if (open && !isEditMode && !locationDetectionAttempted) {
      setLocationDetectionAttempted(true);
      detectLocation();
    }
    // Reset state when dialog closes
    if (!open) {
      setLocationConfirmed(null);
      setLocationDetectionAttempted(false);
      clearDetectedLocation();
    }
  }, [open, isEditMode, locationDetectionAttempted, detectLocation, clearDetectedLocation]);
  
  // Convert volume for display based on user preference
  const getDisplayVolume = (gallons: number | null) => {
    if (!gallons) return null;
    return units === 'metric' ? gallonsToLiters(gallons) : gallons;
  };

  // Parse setup date safely to handle various formats
  const parseSetupDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    try {
      const parsed = new Date(dateStr);
      // Check if valid date
      if (isNaN(parsed.getTime())) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const form = useForm<AquariumFormData>({
    resolver: zodResolver(aquariumSchema),
    defaultValues: {
      name: aquarium?.name || "",
      type: aquarium?.type || "",
      volume_gallons: getDisplayVolume(aquarium?.volume_gallons || null),
      status: (aquarium?.status as "active" | "inactive" | "maintenance") || "active",
      setup_date: parseSetupDate(aquarium?.setup_date || null),
      notes: aquarium?.notes || "",
    },
  });

  // Reset form when aquarium prop changes to prevent stale data
  useEffect(() => {
    if (open && aquarium) {
      form.reset({
        name: aquarium.name || "",
        type: aquarium.type || "",
        volume_gallons: getDisplayVolume(aquarium.volume_gallons || null),
        status: (aquarium.status as "active" | "inactive" | "maintenance") || "active",
        setup_date: parseSetupDate(aquarium.setup_date || null),
        notes: aquarium.notes || "",
      });
    }
  }, [open, aquarium, form, units]);

  const onSubmit = async (data: AquariumFormData) => {
    setIsSubmitting(true);
    try {
      // iOS PWA fix: Try to get session first, refresh if stale
      let currentUser = null;
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session?.user) {
        currentUser = sessionData.session.user;
      } else {
        // Try refreshing the session once (handles iOS PWA stale sessions)
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session?.user) {
          currentUser = refreshData.session.user;
        }
      }
      
      if (!currentUser) {
        throw new Error("Session expired. Please sign in again.");
      }

      // Convert volume to gallons for storage if user entered in liters
      const volumeInGallons = data.volume_gallons && units === 'metric' 
        ? litersToGallons(data.volume_gallons)
        : data.volume_gallons;

      // Base data for updates (excludes user_id to avoid RLS issues)
      const updateData = {
        name: data.name,
        type: data.type,
        volume_gallons: volumeInGallons,
        status: data.status,
        setup_date: data.setup_date?.toISOString().split('T')[0] || null,
        notes: data.notes || null,
        // Include location if confirmed during update
        ...(locationConfirmed === true && latitude && longitude ? {
          latitude,
          longitude,
          location_name: locationName,
        } : {}),
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("aquariums")
          .update(updateData)
          .eq("id", aquarium.id);

        if (error) throw error;

        toast.success(t('aquarium.aquariumUpdated'));
      } else {
        // Include user_id and location (if confirmed) only for new aquariums
        const insertData = {
          ...updateData,
          user_id: currentUser.id,
          ...(locationConfirmed && latitude && longitude ? {
            latitude,
            longitude,
            location_name: locationName,
          } : {}),
        };

        const { error } = await supabase
          .from("aquariums")
          .insert([insertData]);

        if (error) throw error;

        toast.success(t('aquarium.aquariumCreated'));
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving aquarium:", error);
      const errorMessage = error instanceof Error ? error.message : t(isEditMode ? 'aquarium.failedToUpdate' : 'aquarium.failedToCreate');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(isEditMode ? 'aquarium.editAquarium' : 'aquarium.createNew')}</DialogTitle>
          <DialogDescription>
            {t(isEditMode ? 'aquarium.updateDetails' : 'aquarium.addToCollection')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aquarium.name')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('aquarium.namePlaceholder')} {...field} />
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
                  <FormLabel>{t('aquarium.type')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aquarium.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="freshwater">{t('aquarium.types.freshwater')}</SelectItem>
                      <SelectItem value="saltwater">{t('aquarium.types.saltwater')}</SelectItem>
                      <SelectItem value="reef">{t('aquarium.types.reef')}</SelectItem>
                      <SelectItem value="planted">{t('aquarium.types.planted')}</SelectItem>
                      <SelectItem value="brackish">{t('aquarium.types.brackish')}</SelectItem>
                      <SelectItem value="pool_chlorine">{t('aquarium.types.pool_chlorine')}</SelectItem>
                      <SelectItem value="pool_saltwater">{t('aquarium.types.pool_saltwater')}</SelectItem>
                      <SelectItem value="spa">{t('aquarium.types.spa')}</SelectItem>
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
                    <FormLabel>{t('aquarium.volume')} ({getVolumeUnit(units)})</FormLabel>
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
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      onClick={() => {
                        onOpenChange(false);
                        navigate('/ally', {
                          state: {
                            prefillMessage: 'I need help figuring out how many gallons my water body holds. Can you walk me through it? I can take photos and share measurements like depth and length.',
                          },
                        });
                      }}
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      {t('aquarium.volumeCalculatorHelp', { defaultValue: 'Not sure? Let Ally help you calculate →' })}
                    </button>
                  </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aquarium.status')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aquarium.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t('aquarium.statuses.active')}</SelectItem>
                      <SelectItem value="inactive">{t('aquarium.statuses.inactive')}</SelectItem>
                      <SelectItem value="maintenance">{t('aquarium.statuses.maintenance')}</SelectItem>
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
                  <FormLabel>{t('aquarium.setupDate')}</FormLabel>
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
                          {field.value ? format(field.value, "PPP") : t('aquarium.pickDate')}
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
                  <FormLabel>{t('aquarium.notes')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('aquarium.notesPlaceholder')}
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Detection Section */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('aquarium.location')} ({t('common.optional')})
              </FormLabel>
              
              {/* Show saved location in edit mode */}
              {isEditMode && aquarium?.location_name && locationConfirmed === null && (
                <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-md">
                  <span className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {aquarium.location_name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocationConfirmed(false);
                      detectLocation();
                    }}
                  >
                    {t('aquarium.updateLocation')}
                  </Button>
                </div>
              )}

              {locationLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('aquarium.detectingLocation')}</span>
                </div>
              )}

              {!locationLoading && locationName && locationConfirmed === null && !aquarium?.location_name && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {t('aquarium.locationConfirmation', { location: locationName })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLocationConfirmed(true)}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('common.yes')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLocationConfirmed(false)}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('aquarium.skipLocation')}
                    </Button>
                  </div>
                </div>
              )}

              {/* New location detected during update */}
              {!locationLoading && locationName && locationConfirmed === null && isEditMode && aquarium?.location_name && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {t('aquarium.updateLocationConfirmation', { location: locationName })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLocationConfirmed(true)}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('aquarium.useNewLocation')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLocationConfirmed(null);
                        clearDetectedLocation();
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('aquarium.keepCurrent')}
                    </Button>
                  </div>
                </div>
              )}

              {locationConfirmed === true && locationName && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-2 rounded-md">
                  <Check className="h-4 w-4" />
                  <span>{locationName}</span>
                </div>
              )}

              {locationConfirmed === false && !isEditMode && (
                <div className="text-sm text-muted-foreground">
                  {t('aquarium.locationSkipped')}
                </div>
              )}

              {/* Show detect button when no location exists and not currently detecting */}
              {!locationLoading && !locationName && (!isEditMode || !aquarium?.location_name) && locationConfirmed !== true && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  disabled={locationLoading}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {t('aquarium.detectLocation')}
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t(isEditMode ? 'common.update' : 'common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
