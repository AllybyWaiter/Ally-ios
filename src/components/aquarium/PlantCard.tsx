import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Leaf, Activity } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { Plant } from "@/infrastructure/queries/plants";

const conditionColors = {
  growing: 'default',
  melting: 'destructive',
  stable: 'secondary',
} as const;

interface PlantCardProps {
  plant: Plant;
  onEdit: (plant: Plant) => void;
  onDelete: (id: string) => void;
}

export const PlantCard = memo(function PlantCard({
  plant,
  onEdit,
  onDelete,
}: PlantCardProps) {
  return (
    <Card>
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
          <Badge variant={conditionColors[plant.condition as keyof typeof conditionColors]} className="capitalize">
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
  );
});
