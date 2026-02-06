import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, MoreVertical, Pencil, Trash2, MapPin } from "lucide-react";
import { LocationMapPreview } from "@/components/aquarium/LocationMapPreview";
import { AquariumOverview } from "@/components/aquarium/AquariumOverview";
import { AquariumEquipment } from "@/components/aquarium/AquariumEquipment";
import { AquariumTasks } from "@/components/aquarium/AquariumTasks";
import { AquariumLivestock } from "@/components/aquarium/AquariumLivestock";
import { TaskSuggestions } from "@/components/aquarium/TaskSuggestions";
import { AquariumPhotoGallery } from "@/components/aquarium/AquariumPhotoGallery";
import { format, isValid } from "date-fns";

// Lazy load heavy chart component for better initial page load
const WaterTestCharts = lazy(() => import("@/components/water-tests/WaterTestCharts").then(m => ({ default: m.WaterTestCharts })));
import { AquariumDialog } from "@/components/aquarium/AquariumDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatVolume, UnitSystem } from "@/lib/unitConversions";
import { queryKeys } from "@/lib/queryKeys";
import { queryPresets } from "@/lib/queryConfig";
import { fetchAquarium, deleteAquarium as deleteAquariumDAL } from "@/infrastructure/queries";
import { SectionErrorBoundary } from "@/components/error-boundaries";
import { FeatureArea } from "@/lib/sentry";
import { isPoolType, getWaterBodyLabels, formatWaterBodyType } from "@/lib/waterBodyUtils";

// Safe date formatter to prevent crashes - returns empty string for invalid dates
const safeFormatDate = (dateValue: string | null | undefined, formatStr: string = "PPP"): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) {
      console.warn('Invalid date value:', dateValue);
      return '';
    }
    return format(date, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

export default function AquariumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlAddNew = searchParams.get('addNew');
  const { user, loading: authLoading, units } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(urlTab || 'overview');

  const { data: aquarium, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.aquariums.detail(id!),
    queryFn: () => fetchAquarium(id!),
    enabled: !authLoading && !!user && !!id,
    ...queryPresets.aquariumData,
  });

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await deleteAquariumDAL(id);

      // Invalidate queries before navigation to ensure clean state
      queryClient.invalidateQueries({ queryKey: ['aquariums'] });
      queryClient.removeQueries({ queryKey: ['aquarium', id] });

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

  // Show loading while auth is initializing or data is loading
  if (authLoading || isLoading) {
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
        <div className="container mx-auto px-4 py-12 pt-24 mt-safe text-center">
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
        <div className="container mx-auto px-4 py-12 pt-24 mt-safe text-center">
          <h1 className="text-2xl font-bold mb-4">{t('aquarium.notFound')}</h1>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('aquarium.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe">
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
              <Badge variant="secondary">{formatWaterBodyType(aquarium.type, t)}</Badge>
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
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
            {aquarium.volume_gallons != null && aquarium.volume_gallons > 0 && (
              <span>{formatVolume(aquarium.volume_gallons, units)}</span>
            )}
            {aquarium.setup_date && (
              <span>Setup: {safeFormatDate(aquarium.setup_date, "PPP") || 'Unknown'}</span>
            )}
            {!aquarium.location_name && (
              <button
                onClick={() => setEditDialogOpen(true)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <MapPin className="w-3 h-3" />
                {t('aquarium.addLocation')}
              </button>
            )}
          </div>
          {aquarium.notes && (
            <p className="mt-3 text-muted-foreground">{aquarium.notes}</p>
          )}
          
          {/* Map preview when location is saved */}
          {aquarium.location_name && aquarium.latitude != null && aquarium.longitude != null && (
            <div className="mt-4">
              <LocationMapPreview
                latitude={aquarium.latitude}
                longitude={aquarium.longitude}
                locationName={aquarium.location_name}
                onUpdateLocation={() => setEditDialogOpen(true)}
              />
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex overflow-x-auto w-full max-w-3xl mx-auto gap-1 scrollbar-hide">
            <TabsTrigger value="overview" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="photos" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">Photos</TabsTrigger>
            {!isPoolType(aquarium.type) && (
              <TabsTrigger value="livestock" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">Livestock & Plants</TabsTrigger>
            )}
            <TabsTrigger value="water-tests" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.waterTests')}</TabsTrigger>
            <TabsTrigger value="equipment" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.equipment')}</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm">{t('tabs.tasks')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SectionErrorBoundary fallbackTitle="Failed to load overview" featureArea={FeatureArea.AQUARIUM}>
              <AquariumOverview aquariumId={id!} aquarium={aquarium} />
            </SectionErrorBoundary>
          </TabsContent>

          <TabsContent value="photos">
            <SectionErrorBoundary fallbackTitle="Failed to load photos" featureArea={FeatureArea.AQUARIUM}>
              <AquariumPhotoGallery aquariumId={id!} aquariumName={aquarium.name} userId={user?.id ?? ''} />
            </SectionErrorBoundary>
          </TabsContent>

          {!isPoolType(aquarium.type) && (
            <TabsContent value="livestock">
              <SectionErrorBoundary fallbackTitle="Failed to load livestock" featureArea={FeatureArea.AQUARIUM}>
                <AquariumLivestock aquariumId={id!} initialAddNew={urlAddNew} />
              </SectionErrorBoundary>
            </TabsContent>
          )}

          <TabsContent value="water-tests">
            <SectionErrorBoundary fallbackTitle="Failed to load water tests" featureArea={FeatureArea.WATER_TESTS}>
              <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
                <WaterTestCharts aquarium={{ id: id!, name: aquarium.name, type: aquarium.type }} />
              </Suspense>
            </SectionErrorBoundary>
          </TabsContent>

          <TabsContent value="equipment">
            <SectionErrorBoundary fallbackTitle="Failed to load equipment" featureArea={FeatureArea.EQUIPMENT}>
              <AquariumEquipment aquariumId={id!} aquariumType={aquarium.type} initialAddNew={urlAddNew === 'true'} />
            </SectionErrorBoundary>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-6">
              <SectionErrorBoundary fallbackTitle="Failed to load task suggestions" featureArea={FeatureArea.MAINTENANCE}>
                <TaskSuggestions aquariumId={id!} />
              </SectionErrorBoundary>
              <SectionErrorBoundary fallbackTitle="Failed to load tasks" featureArea={FeatureArea.MAINTENANCE}>
                <AquariumTasks aquariumId={id!} />
              </SectionErrorBoundary>
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
