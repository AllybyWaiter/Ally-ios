import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { updateSentryConsent } from "@/lib/sentry";

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_PREFERENCES_KEY = "cookie-preferences";

type ConsentStatus = "accepted" | "declined" | null;

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
    // Also check legacy key for backwards compatibility and migrate if found
    const legacyConsent = localStorage.getItem("ally_cookie_consent") as ConsentStatus;
    
    if (legacyConsent && !consent) {
      // Migrate legacy consent to new key
      localStorage.setItem(COOKIE_CONSENT_KEY, legacyConsent);
      // Apply preferences based on legacy consent
      if (legacyConsent === 'accepted') {
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ essential: true, functional: true, analytics: true }));
        updateSentryConsent();
      } else if (legacyConsent === 'declined') {
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ essential: true, functional: false, analytics: false }));
      }
      return; // Don't show banner since we migrated
    }
    
    if (!consent && !legacyConsent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
    
    // Apply saved preferences on page load
    if (consent === 'accepted') {
      updateSentryConsent();
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ essential: true, functional: true, analytics: true }));
      setShowBanner(false);
      // Re-initialize Sentry now that user has consented
      updateSentryConsent();
    } catch {
      // Silently handle localStorage errors (e.g., private browsing mode)
      setShowBanner(false);
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ essential: true, functional: false, analytics: false }));
      setShowBanner(false);
      // Update Sentry consent status
      updateSentryConsent();
    } catch {
      // Silently handle localStorage errors (e.g., private browsing mode)
      setShowBanner(false);
    }
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0 p-3 bg-primary/10 rounded-full">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
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
