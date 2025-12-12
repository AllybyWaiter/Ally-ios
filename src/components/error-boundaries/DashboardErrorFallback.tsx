import { RefreshCw, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureErrorFallback } from "./FeatureErrorFallback";
import { FeatureArea } from "@/lib/sentry";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function DashboardErrorFallback({ error, resetError }: DashboardErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <FeatureErrorFallback
      error={error}
      resetError={resetError}
      featureArea={FeatureArea.AQUARIUM}
      title="Dashboard Error"
      message="Your aquarium data couldn't be loaded. This might be a temporary issue."
      actions={
        <>
          <Button onClick={resetError} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload Dashboard
          </Button>
          <Button variant="outline" onClick={handleGoToSettings} className="w-full gap-2">
            <Settings className="h-4 w-4" />
            Go to Settings
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Log Out & Back In
          </Button>
        </>
      }
    />
  );
}
