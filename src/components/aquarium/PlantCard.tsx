import React, { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Leaf, Activity, Camera, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPlantPhotos } from "@/infrastructure/queries/plantPhotos";
import type { Plant } from "@/infrastructure/queries/plants";
import PlantDetailDialog from "./PlantDetailDialog";

const conditionColors = {
  thriving: 'default',
  healthy: 'default',
  growing: 'secondary',
  struggling: 'destructive',
  melting: 'destructive',
  dead: 'destructive',
  stable: 'secondary',
} as const;

interface PlantCardProps {
  plant: Plant;
  onEdit: (plant: Plant) => void;
  onDelete: (id: string) => void;
  userId: string;
}

export const PlantCard = memo(function PlantCard({
  plant,
  onEdit,
  onDelete,
  userId,
}: PlantCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: photos = [] } = useQuery({
    queryKey: queryKeys.plants.photos(plant.id),
    queryFn: () => fetchPlantPhotos(plant.id),
  });

  const photoCount = photos.length;

  return (
    <>
      <Card className="overflow-hidden">
        {/* Photo thumbnail */}
        {plant.primary_photo_url ? (
          <div 
            className="aspect-video bg-muted cursor-pointer relative group"
            onClick={() => setDetailOpen(true)}
          >
            <img
              src={plant.primary_photo_url}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
            {photoCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute bottom-2 right-2 bg-black/60 text-white border-0"
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                {photoCount}
              </Badge>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ) : photoCount > 0 ? (
          <div 
            className="aspect-video bg-muted cursor-pointer relative flex items-center justify-center group"
            onClick={() => setDetailOpen(true)}
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 right-2"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              {photoCount}
            </Badge>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ) : null}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{plant.name}</CardTitle>
                <CardDescription className="text-sm truncate">
                  {plant.species}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailOpen(true)}>
                  <Camera className="mr-2 h-4 w-4" />
                  View Photos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(plant)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(plant.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <Badge variant="outline">{plant.quantity}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Condition</span>
            <Badge variant={conditionColors[plant.condition as keyof typeof conditionColors] || 'secondary'} className="capitalize">
              <Activity className="mr-1 h-3 w-3" />
              {plant.condition}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Added</span>
            <span className="font-medium">{formatDate(plant.date_added, 'PP')}</span>
          </div>
          {plant.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
              {plant.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <PlantDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        plant={plant}
        userId={userId}
      />
    </>
  );
});
