import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

export function SentryTestButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      <Bug className="mr-2 h-4 w-4" />
      Test Sentry Error
    </Button>
  );
}
