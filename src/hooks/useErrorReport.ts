import { useState } from "react";
import { useLocation } from "react-router-dom";
import { logError, FeatureAreaType, ErrorSeverity } from "@/lib/sentry";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export function useErrorReport() {
  const [isReporting, setIsReporting] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const reportError = async (error: Error, featureArea: FeatureAreaType, additionalContext?: string) => {
    setIsReporting(true);
    
    try {
      logError(
        error,
        {
          userReported: true,
          route: location.pathname,
          userId: user?.id,
          userEmail: user?.email,
          additionalContext,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
        featureArea,
        ErrorSeverity.HIGH
      );
      
      toast.success("Issue reported", {
        description: "Thank you for reporting this issue. Our team has been notified.",
      });
    } catch (reportError) {
      logger.error("Failed to report error:", reportError);
      toast.error("Failed to report issue", {
        description: "Please try again or contact support directly.",
      });
    } finally {
      setIsReporting(false);
    }
  };

  return { reportError, isReporting };
}
