import { RefreshCw, MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureErrorFallback } from "./FeatureErrorFallback";
import { FeatureArea } from "@/lib/sentry";

interface ChatErrorFallbackProps {
  error: Error;
  resetError: () => void;
  onStartNewConversation?: () => void;
  onClearHistory?: () => void;
}

export function ChatErrorFallback({ 
  error, 
  resetError,
  onStartNewConversation,
  onClearHistory,
}: ChatErrorFallbackProps) {
  return (
    <FeatureErrorFallback
      error={error}
      resetError={resetError}
      featureArea={FeatureArea.CHAT}
      title="Chat Unavailable"
      message="The chat service is temporarily unavailable. Please try again in a moment."
      actions={
        <>
          <Button onClick={resetError} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </Button>
          {onStartNewConversation && (
            <Button variant="outline" onClick={onStartNewConversation} className="w-full gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Start New Conversation
            </Button>
          )}
          {onClearHistory && (
            <Button variant="ghost" onClick={onClearHistory} className="w-full gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Chat History
            </Button>
          )}
        </>
      }
    />
  );
}
