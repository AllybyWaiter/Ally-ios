import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const InstallPromptBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) return;

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Detect iOS
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("install-prompt-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-lg flex items-start gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm">Install Ally for quick access</p>
          <p className="text-xs text-primary-foreground/80 mt-1">
            {isIOS ? (
              <>Tap <Share className="inline h-3 w-3 mx-0.5" /> then "Add to Home Screen" <PlusSquare className="inline h-3 w-3 mx-0.5" /></>
            ) : (
              <>Tap the menu button and select "Add to Home Screen"</>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 -mt-1 -mr-1 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InstallPromptBanner;
