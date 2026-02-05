import React, { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Fish, Bug, Flower2, HelpCircle, Activity, Image } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { queryKeys } from "@/lib/queryKeys";
import { getLivestockPhotoCount } from "@/infrastructure/queries/livestockPhotos";
import type { Livestock } from "@/infrastructure/queries/livestock";
import LivestockDetailDialog from "./LivestockDetailDialog";

const categoryIcons = {
  fish: Fish,
  invertebrate: Bug,
  coral: Flower2,
  other: HelpCircle,
};

const healthColors = {
  healthy: 'default',
  sick: 'destructive',
  quarantine: 'secondary',
} as const;

interface LivestockCardProps {
  livestock: Livestock;
  onEdit: (livestock: Livestock) => void;
  onDelete: (id: string) => void;
  userId: string;
}

export const LivestockCard = memo(function LivestockCard({
  livestock,
  onEdit,
  onDelete,
  userId,
}: LivestockCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const Icon = categoryIcons[livestock.category as keyof typeof categoryIcons] || HelpCircle;

  const { data: photoCount = 0 } = useQuery({
    queryKey: [...queryKeys.livestock.photos(livestock.id), 'count'],
    queryFn: () => getLivestockPhotoCount(livestock.id),
  });

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDetail(true)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              {/* Photo or Icon */}
              {livestock.primary_photo_url ? (
                <div className="relative">
                  <img
                    src={livestock.primary_photo_url}
                    alt={livestock.name || 'Livestock photo'}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  {photoCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                    >
                      {photoCount}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {photoCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                    >
                      {photoCount}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{livestock.name}</CardTitle>
                <CardDescription className="text-sm truncate">
                  {livestock.species}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}>
                  <Image className="mr-2 h-4 w-4" />
                  View Photos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(livestock); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(livestock.id); }}
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
            <Badge variant="outline">{livestock.quantity}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Health</span>
            <Badge variant={healthColors[livestock.health_status as keyof typeof healthColors]} className="capitalize">
              <Activity className="mr-1 h-3 w-3" />
              {livestock.health_status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Added</span>
            <span className="font-medium">{formatDate(livestock.date_added, 'PP')}</span>
          </div>
          {livestock.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
              {livestock.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <LivestockDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        livestock={livestock}
        userId={userId}
      />
    </>
  );
});
