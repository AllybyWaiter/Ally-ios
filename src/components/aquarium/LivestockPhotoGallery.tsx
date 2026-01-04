import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X, Star, Trash2, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
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
import {
  fetchLivestockPhotos,
  setAsPrimaryPhoto,
  deleteLivestockPhoto,
  LivestockPhoto,
} from '@/infrastructure/queries/livestockPhotos';
import LivestockPhotoUpload from './LivestockPhotoUpload';

interface LivestockPhotoGalleryProps {
  livestockId: string;
  livestockName: string;
  userId: string;
}

export default function LivestockPhotoGallery({
  livestockId,
  livestockName,
  userId,
}: LivestockPhotoGalleryProps) {
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deletePhoto, setDeletePhoto] = useState<LivestockPhoto | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: queryKeys.livestock.photos(livestockId),
    queryFn: () => fetchLivestockPhotos(livestockId),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (photo: LivestockPhoto) =>
      setAsPrimaryPhoto(photo.id, livestockId, photo.photo_url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.livestock.photos(livestockId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.livestock.all });
      toast.success('Profile photo updated');
    },
    onError: () => toast.error('Failed to set profile photo'),
  });

  const deleteMutation = useMutation({
    mutationFn: (photo: LivestockPhoto) =>
      deleteLivestockPhoto(photo.id, photo.photo_url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.livestock.photos(livestockId) });
      toast.success('Photo deleted');
      setDeletePhoto(null);
    },
    onError: () => toast.error('Failed to delete photo'),
  });

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
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
      {/* Upload Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowUpload(true)}
      >
        <ImagePlus className="h-4 w-4 mr-2" />
        Add Photo
      </Button>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ImagePlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No photos yet</p>
          <p className="text-sm">Add photos to track {livestockName}'s journey</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || livestockName}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {photo.is_primary && (
                <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                  <Star className="h-3 w-3 text-primary-foreground fill-current" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black/95 border-none">
          <VisuallyHidden.Root>
            <DialogTitle>Photo Viewer</DialogTitle>
          </VisuallyHidden.Root>
          {selectedPhoto && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation */}
              {selectedIndex !== null && selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {selectedIndex !== null && selectedIndex < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Image */}
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.caption || livestockName}
                className="w-full max-h-[70vh] object-contain"
              />

              {/* Info bar */}
              <div className="p-4 bg-background/90 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedPhoto.caption && (
                      <p className="font-medium">{selectedPhoto.caption}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedPhoto.taken_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimaryMutation.mutate(selectedPhoto)}
                      disabled={selectedPhoto.is_primary || setPrimaryMutation.isPending}
                    >
                      <Star className={`h-4 w-4 mr-1 ${selectedPhoto.is_primary ? 'fill-current' : ''}`} />
                      {selectedPhoto.is_primary ? 'Profile Photo' : 'Set as Profile'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletePhoto(selectedPhoto)}
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

      {/* Upload Dialog */}
      <LivestockPhotoUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        livestockId={livestockId}
        livestockName={livestockName}
        userId={userId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePhoto} onOpenChange={() => setDeletePhoto(null)}>
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
              onClick={() => deletePhoto && deleteMutation.mutate(deletePhoto)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
