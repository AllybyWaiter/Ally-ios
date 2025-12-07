import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { AquariumOverview } from "@/components/aquarium/AquariumOverview";
import { WaterTestCharts } from "@/components/water-tests/WaterTestCharts";
import { AquariumEquipment } from "@/components/aquarium/AquariumEquipment";
import { AquariumTasks } from "@/components/aquarium/AquariumTasks";
import { AquariumLivestock } from "@/components/aquarium/AquariumLivestock";
import { TaskSuggestions } from "@/components/aquarium/TaskSuggestions";
import { format, isValid } from "date-fns";
import { AquariumDialog } from "@/components/aquarium/AquariumDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatVolume, UnitSystem } from "@/lib/unitConversions";

// Safe date formatter to prevent crashes
const safeFormatDate = (dateValue: string | null | undefined, formatStr: string = "PPP"): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) return 'Invalid date';
    return format(date, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

export default function AquariumDetail() {
  console.log('🔵 AquariumDetail: Component mounting');
  const { id } = useParams();
  console.log('🔵 AquariumDetail: Route param id =', id);
  const navigate = useNavigate();
  const { units } = useAuth();
  console.log('🔵 AquariumDetail: units =', units);
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: aquarium, isLoading, error, refetch } = useQuery({
    queryKey: ["aquarium", id],
    queryFn: async () => {
      console.log('🔵 AquariumDetail: Fetching aquarium data for id =', id);
      const { data, error } = await supabase
        .from("aquariums")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error('🔴 AquariumDetail: Supabase query error:', error);
        throw error;
      }
      console.log('🟢 AquariumDetail: Aquarium data received:', JSON.stringify(data, null, 2));
      return data;
    },
  });

  console.log('🔵 AquariumDetail: Render state - isLoading:', isLoading, 'error:', error, 'aquarium:', aquarium ? 'exists' : 'null');

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from("aquariums")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dashboard.aquariumDeleted'),
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting aquarium:", error);
      toast({
        title: t('common.error'),
        description: t('dashboard.failedToDelete'),
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle query errors
  if (error) {
    console.error('AquariumDetail query error:', error);
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="container mx-auto px-4 py-12 pt-28 text-center">
          <h1 className="text-2xl font-bold mb-4">Error loading aquarium</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('aquarium.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  if (!aquarium) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="container mx-auto px-4 py-12 pt-28 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('aquarium.notFound')}</h1>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('aquarium.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  console.log('🟢 AquariumDetail: Rendering main content with aquarium:', aquarium?.name);
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 pt-28">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('aquarium.backToDashboard')}
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{aquarium.name}</h1>
              <Badge variant="secondary">{aquarium.type}</Badge>
              <Badge variant="outline">{aquarium.status}</Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('aquarium.editAquarium')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('dashboard.deleteAquarium')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {aquarium.volume_gallons != null && aquarium.volume_gallons > 0 && (
              <span>{formatVolume(aquarium.volume_gallons, units)}</span>
            )}
            {aquarium.setup_date && (
              <span>Setup: {safeFormatDate(aquarium.setup_date, "PPP")}</span>
            )}
          </div>
          {aquarium.notes && (
            <p className="mt-3 text-muted-foreground">{aquarium.notes}</p>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex overflow-x-auto w-full max-w-3xl mx-auto gap-1 scrollbar-hide">
            <TabsTrigger value="overview" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="livestock" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">Livestock & Plants</TabsTrigger>
            <TabsTrigger value="water-tests" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.waterTests')}</TabsTrigger>
            <TabsTrigger value="equipment" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.equipment')}</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.tasks')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AquariumOverview aquariumId={id!} aquarium={aquarium} />
          </TabsContent>

          <TabsContent value="livestock">
            <AquariumLivestock aquariumId={id!} />
          </TabsContent>

          <TabsContent value="water-tests">
            <WaterTestCharts aquarium={{ id: id!, name: aquarium.name, type: aquarium.type }} />
          </TabsContent>

          <TabsContent value="equipment">
            <AquariumEquipment aquariumId={id!} />
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-6">
              <TaskSuggestions aquariumId={id!} />
              <AquariumTasks aquariumId={id!} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AquariumDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refetch}
        aquarium={aquarium}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.deleteAquarium')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.deleteConfirmation', { name: aquarium.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
