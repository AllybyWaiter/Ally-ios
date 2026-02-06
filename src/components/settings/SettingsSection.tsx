import { cn } from "@/lib/utils";
import React from "react";

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  // Convert children to array for rendering separators
  const childArray = React.Children.toArray(children);

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 sm:px-1">
          {title}
        </p>
      )}
      <div className="mx-4 sm:mx-0 rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 overflow-hidden">
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {/* Indented separator (iOS style - starts after icon area) */}
            {index > 0 && <div className="h-px bg-border/50 ml-14" />}
            {child}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
