import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight, X, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { fetchAquariumPhotos, setAsPrimaryAquariumPhoto, deleteAquariumPhoto } from '@/infrastructure/queries/aquariumPhotos';
import { AquariumPhotoUpload } from './AquariumPhotoUpload';
import { queryKeys } from '@/lib/queryKeys';

interface AquariumPhotoGalleryProps {
  aquariumId: string;
  aquariumName: string;
  userId: string;
}

export function AquariumPhotoGallery({ aquariumId, aquariumName, userId }: AquariumPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; url: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: queryKeys.aquariums.photos(aquariumId),
    queryFn: () => fetchAquariumPhotos(aquariumId),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: ({ photoId, photoUrl }: { photoId: string; photoUrl: string }) =>
      setAsPrimaryAquariumPhoto(photoId, aquariumId, photoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aquariums.photos(aquariumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.aquariums.detail(aquariumId) });
      toast.success('Cover photo updated');
    },
    onError: () => toast.error('Failed to set cover photo'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ photoId, photoUrl }: { photoId: string; photoUrl: string }) =>
      deleteAquariumPhoto(photoId, photoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aquariums.photos(aquariumId) });
      toast.success('Photo deleted');
      setPhotoToDelete(null);
      setSelectedIndex(null);
    },
    onError: () => toast.error('Failed to delete photo'),
  });

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Photos ({photos.length})</h3>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Photo
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No photos yet</p>
          <Button variant="link" onClick={() => setShowUpload(true)}>
            Add your first photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-square overflow-hidden rounded-lg group"
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || `Photo of ${aquariumName}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {photo.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-1">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          <VisuallyHidden.Root>
            <DialogTitle>Photo Viewer</DialogTitle>
          </VisuallyHidden.Root>
          {selectedPhoto && (
            <div className="relative">
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.caption || 'Aquarium photo'}
                className="w-full max-h-[80vh] object-contain"
              />

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="w-5 h-5" />
              </Button>

              {selectedIndex !== null && selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}

              {selectedIndex !== null && selectedIndex < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedPhoto.caption && (
                      <p className="text-white">{selectedPhoto.caption}</p>
                    )}
                    <p className="text-white/70 text-sm">
                      {new Date(selectedPhoto.taken_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!selectedPhoto.is_primary && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setPrimaryMutation.mutate({
                            photoId: selectedPhoto.id,
                            photoUrl: selectedPhoto.photo_url,
                          })
                        }
                        disabled={setPrimaryMutation.isPending}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Set as Cover
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setPhotoToDelete({
                          id: selectedPhoto.id,
                          url: selectedPhoto.photo_url,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!photoToDelete} onOpenChange={() => setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (photoToDelete) {
                  deleteMutation.mutate({ photoId: photoToDelete.id, photoUrl: photoToDelete.url });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AquariumPhotoUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        aquariumId={aquariumId}
        aquariumName={aquariumName}
        userId={userId}
      />
    </div>
  );
}
