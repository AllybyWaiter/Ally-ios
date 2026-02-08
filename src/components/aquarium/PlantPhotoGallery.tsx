import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronLeft, ChevronRight, X, Star, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { fetchPlantPhotos, setAsPrimaryPlantPhoto, deletePlantPhoto } from '@/infrastructure/queries/plantPhotos';
import PlantPhotoUpload from './PlantPhotoUpload';

interface PlantPhotoGalleryProps {
  plantId: string;
  plantName: string;
  userId: string;
}

export default function PlantPhotoGallery({ plantId, plantName, userId }: PlantPhotoGalleryProps) {
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: queryKeys.plants.photos(plantId),
    queryFn: () => fetchPlantPhotos(plantId),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (photoId: string) => setAsPrimaryPlantPhoto(photoId, plantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.photos(plantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.all });
      toast.success('Primary photo updated');
    },
    onError: () => toast.error('Failed to set primary photo'),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deletePlantPhoto(photoId, plantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.photos(plantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.plants.all });
      toast.success('Photo deleted');
      setDeletePhotoId(null);
      if (selectedIndex !== null && selectedIndex >= photos.length - 1) {
        setSelectedIndex(photos.length > 1 ? photos.length - 2 : null);
      }
    },
    onError: () => toast.error('Failed to delete photo'),
  });

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    if (direction === 'prev' && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (direction === 'next' && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Photo
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No photos yet</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setShowUpload(true)}
          >
            Add the first photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square cursor-pointer group"
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              {photo.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-1">
                  <Star className="h-3 w-3" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black/95">
          <VisuallyHidden.Root>
            <DialogTitle>Photo Viewer</DialogTitle>
          </VisuallyHidden.Root>
          {selectedPhoto && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.caption || 'Plant photo'}
                className="w-full max-h-[70vh] object-contain"
              />

              {/* Navigation */}
              {selectedIndex! > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => navigatePhoto('prev')}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              {selectedIndex! < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => navigatePhoto('next')}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Info & Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    {selectedPhoto.caption && (
                      <p className="text-sm">{selectedPhoto.caption}</p>
                    )}
                    {selectedPhoto.taken_at && (
                      <p className="text-xs text-white/70">
                        {new Date(selectedPhoto.taken_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={selectedPhoto.is_primary || setPrimaryMutation.isPending}
                      onClick={() => setPrimaryMutation.mutate(selectedPhoto.id)}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      {selectedPhoto.is_primary ? 'Primary' : 'Set Primary'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletePhotoId(selectedPhoto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePhotoId} onOpenChange={() => setDeletePhotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this photo. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePhotoId && deleteMutation.mutate(deletePhotoId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <PlantPhotoUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        plantId={plantId}
        plantName={plantName}
        userId={userId}
      />
    </div>
  );
}
