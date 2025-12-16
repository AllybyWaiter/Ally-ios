import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_CONSENT_KEY = "ally_cookie_consent";

type ConsentStatus = "accepted" | "declined" | null;

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
    if (!consent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  const handleClose = () => {
    // Just close without saving preference - will show again next visit
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="relative bg-card border border-border rounded-xl shadow-xl p-6">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Close cookie banner"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0 p-3 bg-primary/10 rounded-full">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1 pr-6 sm:pr-0">
                  <h3 className="font-semibold text-foreground mb-1">Cookie Preferences</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                    By clicking "Accept All", you consent to our use of cookies. Read our{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    for more information.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDecline}
                    className="w-full sm:w-auto"
                  >
                    Essential Only
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="w-full sm:w-auto"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
