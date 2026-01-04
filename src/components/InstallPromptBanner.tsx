import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPromptBanner = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // All hooks must be called before any conditional returns (React Rules of Hooks)
  useEffect(() => {
    // Only run for authenticated users
    if (!user) return;
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Detect iOS
    const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check dismissal with expiry (show again after 7 days)
    const dismissedData = localStorage.getItem("install-prompt-dismissed");
    if (dismissedData) {
      try {
        const { timestamp, type } = JSON.parse(dismissedData);
        const daysSinceDismissal = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        
        // If permanently dismissed, don't show
        if (type === "permanent") return;
        
        // If temporarily dismissed, show again after 7 days
        if (type === "temporary" && daysSinceDismissal < 7) return;
      } catch {
        // Invalid JSON, remove corrupt data
        localStorage.removeItem("install-prompt-dismissed");
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show banner after a short delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [user]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsVisible(false);
        localStorage.setItem("install-prompt-dismissed", JSON.stringify({
          timestamp: Date.now(),
          type: "permanent"
        }));
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = (permanent: boolean) => {
    setIsVisible(false);
    localStorage.setItem("install-prompt-dismissed", JSON.stringify({
      timestamp: Date.now(),
      type: permanent ? "permanent" : "temporary"
    }));
  };

  if (!user || !isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold text-sm">Install Ally for quick access</p>
            <p className="text-xs text-primary-foreground/80 mt-1">
              {isIOS ? (
                <>Tap <Share className="inline h-3 w-3 mx-0.5" /> then "Add to Home Screen" <PlusSquare className="inline h-3 w-3 mx-0.5" /></>
              ) : (
                <>Get the app experience with offline support</>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 -mt-1 -mr-1 h-8 w-8"
            onClick={() => handleDismiss(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {deferredPrompt && !isIOS && (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4 mr-1" />
              Install Now
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => handleDismiss(true)}
          >
            Don't show again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPromptBanner;
