import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { uploadLivestockPhoto } from '@/infrastructure/queries/livestockPhotos';
import { compressImage, isImageFile, validateImageFile } from '@/lib/imageCompression';

interface LivestockPhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  livestockId: string;
  livestockName: string;
  userId: string;
}

export default function LivestockPhotoUpload({
  open,
  onOpenChange,
  livestockId,
  livestockName,
  userId,
}: LivestockPhotoUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [isCompressing, setIsCompressing] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      
      setIsCompressing(true);
      const compressed = await compressImage(selectedFile, 1, 1920, 0.85);
      setIsCompressing(false);
      
      return uploadLivestockPhoto(livestockId, userId, compressed, caption, takenAt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.livestock.photos(livestockId) });
      toast.success('Photo uploaded');
      handleClose();
    },
    onError: () => {
      setIsCompressing(false);
      toast.error('Failed to upload photo');
    },
  });

  const handleFileSelect = async (file: File) => {
    if (!isImageFile(file)) {
      toast.error('Please select an image file');
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setTakenAt(new Date().toISOString().split('T')[0]);
    onOpenChange(false);
  };

  const isUploading = uploadMutation.isPending || isCompressing;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Photo</DialogTitle>
          <DialogDescription>
            Add a photo of {livestockName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo selection */}
          {!preview ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Gallery
              </Button>
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Livestock photo preview"
                className="w-full rounded-lg max-h-64 object-contain bg-muted"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
              >
                Change
              </Button>
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              placeholder="Add a note about this photo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="takenAt">Date Taken</Label>
            <Input
              id="takenAt"
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isCompressing ? 'Compressing...' : 'Uploading...'}
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
