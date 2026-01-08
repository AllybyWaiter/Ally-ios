import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          {title}
        </p>
      )}
      <div className="rounded-xl bg-background/80 backdrop-blur-lg border border-border/30 overflow-hidden divide-y divide-border/30">
        {children}
      </div>
    </div>
  );
}
