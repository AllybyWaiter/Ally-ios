import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Leaf, MapPin, CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { queryKeys } from '@/lib/queryKeys';
import { fetchPlantPhotos } from '@/infrastructure/queries/plantPhotos';
import { Plant } from '@/infrastructure/queries/plants';
import PlantPhotoGallery from './PlantPhotoGallery';

interface PlantDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: Plant;
  userId: string;
}

const conditionColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  thriving: 'default',
  healthy: 'default',
  growing: 'secondary',
  struggling: 'destructive',
  melting: 'destructive',
  dead: 'destructive',
};

const placementLabels: Record<string, string> = {
  foreground: 'Foreground',
  midground: 'Midground',
  background: 'Background',
  floating: 'Floating',
  carpet: 'Carpet',
};

export default function PlantDetailDialog({
  open,
  onOpenChange,
  plant,
  userId,
}: PlantDetailDialogProps) {
  const { data: photos = [] } = useQuery({
    queryKey: queryKeys.plants.photos(plant.id),
    queryFn: () => fetchPlantPhotos(plant.id),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            {plant.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="photos" className="relative">
              Photos
              {photos.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {photos.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Primary Photo */}
            {plant.primary_photo_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={plant.primary_photo_url}
                  alt={plant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Species</span>
                <span className="text-sm font-medium">{plant.species}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <span className="text-sm font-medium">{plant.quantity}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Condition</span>
                <Badge variant={conditionColors[plant.condition] || 'secondary'}>
                  {plant.condition.charAt(0).toUpperCase() + plant.condition.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Placement
                </span>
                <span className="text-sm font-medium">
                  {placementLabels[plant.placement] || plant.placement}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Date Added
                </span>
                <span className="text-sm font-medium">
                  {new Date(plant.date_added).toLocaleDateString()}
                </span>
              </div>

              {plant.notes && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <p className="text-sm mt-1">{plant.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="flex-1 overflow-y-auto mt-4">
            <PlantPhotoGallery
              plantId={plant.id}
              plantName={plant.name}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
