import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlayCircle } from "lucide-react";

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
}

const DemoVideoModal = ({
  isOpen,
  onClose,
  videoUrl,
  title = "Product Demo",
}: DemoVideoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <PlayCircle className="w-16 h-16" />
              <p className="text-lg font-medium">Demo Video Coming Soon</p>
              <p className="text-sm">We're creating an amazing demo to showcase Ally in action</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoVideoModal;
