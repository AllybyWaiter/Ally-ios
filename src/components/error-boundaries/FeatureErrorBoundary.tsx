import React, { Component, ErrorInfo, ReactNode } from "react";
import { logError, FeatureAreaType, FeatureArea, ErrorSeverity } from "@/lib/sentry";
import { DashboardErrorFallback } from "./DashboardErrorFallback";
import { ChatErrorFallback } from "./ChatErrorFallback";
import { WaterTestsErrorFallback } from "./WaterTestsErrorFallback";
import { CalendarErrorFallback } from "./CalendarErrorFallback";
import { AdminErrorFallback } from "./AdminErrorFallback";
import { FeatureErrorFallback } from "./FeatureErrorFallback";

interface Props {
  children: ReactNode;
  featureArea: FeatureAreaType;
  onStartNewConversation?: () => void;
  onClearHistory?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
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
      {
        componentStack: errorInfo.componentStack,
        featureArea: this.props.featureArea,
        route: window.location.pathname,
      },
      this.props.featureArea,
      ErrorSeverity.HIGH
    );
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      const { featureArea, onStartNewConversation, onClearHistory } = this.props;
      const error = this.state.error;

      switch (featureArea) {
        case FeatureArea.AQUARIUM:
          return <DashboardErrorFallback error={error} resetError={this.resetError} />;
        case FeatureArea.CHAT:
          return (
            <ChatErrorFallback
              error={error}
              resetError={this.resetError}
              onStartNewConversation={onStartNewConversation}
              onClearHistory={onClearHistory}
            />
          );
        case FeatureArea.WATER_TESTS:
          return <WaterTestsErrorFallback error={error} resetError={this.resetError} />;
        case FeatureArea.MAINTENANCE:
          return <CalendarErrorFallback error={error} resetError={this.resetError} />;
        case FeatureArea.ADMIN:
          return <AdminErrorFallback error={error} resetError={this.resetError} />;
        default:
          return (
            <FeatureErrorFallback
              error={error}
              resetError={this.resetError}
              featureArea={featureArea}
            />
          );
      }
    }

    return this.props.children;
  }
}
