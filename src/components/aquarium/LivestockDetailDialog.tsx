import React from 'react';
import { format } from 'date-fns';
import { Fish, Shell, Bug, Waves, Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Livestock } from '@/infrastructure/queries/livestock';
import LivestockPhotoGallery from './LivestockPhotoGallery';

const categoryIcons: Record<string, React.ReactNode> = {
  fish: <Fish className="h-5 w-5" />,
  invertebrate: <Shell className="h-5 w-5" />,
  coral: <Waves className="h-5 w-5" />,
  other: <Bug className="h-5 w-5" />,
};

const healthColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy: 'default',
  sick: 'destructive',
  recovering: 'secondary',
  quarantine: 'outline',
};

interface LivestockDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  livestock: Livestock;
  userId: string;
}

export default function LivestockDetailDialog({
  open,
  onOpenChange,
  livestock,
  userId,
}: LivestockDetailDialogProps) {
  const CategoryIcon = categoryIcons[livestock.category] || categoryIcons.other;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {livestock.primary_photo_url ? (
              <img
                src={livestock.primary_photo_url}
                alt={livestock.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {CategoryIcon}
              </div>
            )}
            <div>
              <DialogTitle className="text-left">{livestock.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{livestock.species}</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium">{livestock.quantity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Health</p>
                <Badge variant={healthColors[livestock.health_status] || 'default'}>
                  <Heart className="h-3 w-3 mr-1" />
                  {livestock.health_status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <div className="flex items-center gap-1.5 capitalize">
                  {CategoryIcon}
                  {livestock.category}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Added</p>
                <p className="font-medium">
                  {format(new Date(livestock.date_added), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Notes */}
            {livestock.notes && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{livestock.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <LivestockPhotoGallery
              livestockId={livestock.id}
              livestockName={livestock.name}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
