import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tips?: string[];
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tips,
  children,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
        
        {tips && tips.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Tips</p>
            <ul className="text-sm text-muted-foreground space-y-1">
            {tips.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
            </ul>
          </div>
        )}
        
        {children}
      </CardContent>
    </Card>
  );
}
