import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { createFeedback, FeedbackContext } from "@/infrastructure/queries/feedback";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackButtonsProps {
  feature: "chat" | "photo_analysis" | "task_suggestions" | "ticket_reply";
  messageId?: string;
  waterTestId?: string;
  context?: FeedbackContext;
  onFeedbackSubmitted?: (rating: "positive" | "negative") => void;
  className?: string;
  size?: "sm" | "default";
}

export const FeedbackButtons = ({
  feature,
  messageId,
  waterTestId,
  context,
  onFeedbackSubmitted,
  className,
  size = "sm",
}: FeedbackButtonsProps) => {
  const [submittedRating, setSubmittedRating] = useState<"positive" | "negative" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (rating: "positive" | "negative") => {
    if (submittedRating || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        toast.error("Please sign in to provide feedback");
        return;
      }

      await createFeedback({
        user_id: user.id,
        feature,
        message_id: messageId || null,
        water_test_id: waterTestId || null,
        rating,
        context: context || null,
      });

      setSubmittedRating(rating);
      onFeedbackSubmitted?.(rating);
      
      if (rating === "positive") {
        toast.success("Thanks for the feedback!");
      } else {
        toast.success("Thanks! We'll work to improve.");
      }
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";

  if (submittedRating) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {submittedRating === "positive" ? (
          <ThumbsUp className={cn(iconSize, "text-green-500")} />
        ) : (
          <ThumbsDown className={cn(iconSize, "text-amber-500")} />
        )}
        <span className="text-xs text-muted-foreground">Thanks!</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(buttonSize, "hover:text-green-500 hover:bg-green-500/10")}
            onClick={() => handleFeedback("positive")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className={cn(iconSize, "animate-spin")} />
            ) : (
              <ThumbsUp className={iconSize} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Good response</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(buttonSize, "hover:text-amber-500 hover:bg-amber-500/10")}
            onClick={() => handleFeedback("negative")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className={cn(iconSize, "animate-spin")} />
            ) : (
              <ThumbsDown className={iconSize} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Needs improvement</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
