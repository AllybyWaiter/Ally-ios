import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError, FeatureAreaType, FeatureArea, ErrorSeverity } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  featureArea?: FeatureAreaType;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(
      error,
      { componentStack: errorInfo.componentStack },
      this.props.featureArea || FeatureArea.GENERAL,
      ErrorSeverity.MEDIUM
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {this.props.fallbackTitle || "Failed to load this section"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
