import { RefreshCw, History, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureErrorFallback } from "./FeatureErrorFallback";
import { FeatureArea } from "@/lib/sentry";
import { useNavigate } from "react-router-dom";

interface WaterTestsErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function WaterTestsErrorFallback({ error, resetError }: WaterTestsErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <FeatureErrorFallback
      error={error}
      resetError={resetError}
      featureArea={FeatureArea.WATER_TESTS}
      title="Water Tests Error"
      message="Unable to load water test form. Your previous tests are safe."
      actions={
        <>
          <Button onClick={resetError} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" onClick={handleGoToDashboard} className="w-full gap-2">
            <Droplets className="h-4 w-4" />
            Select Different Aquarium
          </Button>
          <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full gap-2">
            <History className="h-4 w-4" />
            View History
          </Button>
        </>
      }
    />
  );
}
