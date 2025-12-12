import { RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureErrorFallback } from "./FeatureErrorFallback";
import { FeatureArea } from "@/lib/sentry";
import { useNavigate } from "react-router-dom";

interface CalendarErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function CalendarErrorFallback({ error, resetError }: CalendarErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <FeatureErrorFallback
      error={error}
      resetError={resetError}
      featureArea={FeatureArea.MAINTENANCE}
      title="Calendar Error"
      message="Calendar data couldn't be loaded. Your tasks are still saved."
      actions={
        <>
          <Button onClick={resetError} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" onClick={handleGoToDashboard} className="w-full gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </>
      }
    />
  );
}
