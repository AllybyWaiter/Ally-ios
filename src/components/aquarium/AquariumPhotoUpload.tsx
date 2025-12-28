import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { uploadAquariumPhoto } from '@/infrastructure/queries/aquariumPhotos';
import { compressImage } from '@/lib/imageCompression';
import { queryKeys } from '@/lib/queryKeys';

interface AquariumPhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aquariumId: string;
  aquariumName: string;
  userId: string;
}

export function AquariumPhotoUpload({
  open,
  onOpenChange,
  aquariumId,
  aquariumName,
  userId,
}: AquariumPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      setIsCompressing(true);
      const compressedFile = await compressImage(selectedFile);
      setIsCompressing(false);
      return uploadAquariumPhoto(aquariumId, userId, compressedFile, caption, takenAt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aquariums.photos(aquariumId) });
      toast.success('Photo uploaded successfully');
      handleClose();
    },
    onError: (error) => {
      toast.error('Failed to upload photo');
      console.error('Upload error:', error);
      setIsCompressing(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setTakenAt(new Date().toISOString().split('T')[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Photo to {aquariumName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <div className="flex gap-3">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Gallery
              </Button>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Input
              id="caption"
              placeholder="Describe this photo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="takenAt">Date Taken</Label>
            <Input
              id="takenAt"
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => uploadMutation.mutate()}
              disabled={!selectedFile || uploadMutation.isPending || isCompressing}
            >
              {isCompressing ? 'Compressing...' : uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
