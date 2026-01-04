import { AlertTriangle, RefreshCw, ArrowLeft, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useErrorReport } from "@/hooks/useErrorReport";
import { FeatureAreaType } from "@/lib/sentry";

interface FeatureErrorFallbackProps {
  error: Error;
  resetError: () => void;
  featureArea: FeatureAreaType;
  title?: string;
  message?: string;
  actions?: React.ReactNode;
}

export function FeatureErrorFallback({
  error,
  resetError,
  featureArea,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  actions,
}: FeatureErrorFallbackProps) {
  const { reportError, isReporting } = useErrorReport();

  const handleReport = () => {
    reportError(error, featureArea);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {import.meta.env.DEV && (
            <details className="text-left text-xs bg-muted/50 p-3 rounded-md">
              <summary className="cursor-pointer font-medium text-muted-foreground">
                Error Details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-destructive">
                {error.message}
              </pre>
            </details>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {actions || (
            <>
              <Button onClick={resetError} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoBack} className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            disabled={isReporting}
            className="w-full gap-2 text-muted-foreground"
          >
            <Bug className="h-4 w-4" />
            {isReporting ? "Reporting..." : "Report Issue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
