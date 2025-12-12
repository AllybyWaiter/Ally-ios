import { RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureErrorFallback } from "./FeatureErrorFallback";
import { FeatureArea } from "@/lib/sentry";
import { useNavigate } from "react-router-dom";

interface AdminErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function AdminErrorFallback({ error, resetError }: AdminErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <FeatureErrorFallback
      error={error}
      resetError={resetError}
      featureArea={FeatureArea.ADMIN}
      title="Admin Panel Error"
      message="The admin panel encountered an error. Please try again or contact support."
      actions={
        <>
          <Button onClick={resetError} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Admin Panel
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
