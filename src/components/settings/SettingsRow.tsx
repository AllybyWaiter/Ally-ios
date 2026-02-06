import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SettingsRowProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  description?: string;
  value?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function SettingsRow({
  icon: Icon,
  iconClassName,
  label,
  description,
  value,
  onClick,
  href,
  external,
  rightElement,
  className,
  variant = 'default',
}: SettingsRowProps) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-left min-w-0 flex-1">
          <span className={cn(
            "font-medium text-sm",
            variant === 'destructive' && "text-destructive"
          )}>{label}</span>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
      </div>
      {rightElement || (
        <div className="flex items-center gap-2 shrink-0">
          {value}
          {(onClick || href) && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
        </div>
      )}
    </>
  );

  const baseClasses = cn(
    "w-full flex items-center justify-between px-4 py-3.5 transition-colors",
    (onClick || href) && "hover:bg-foreground/5 cursor-pointer",
    className
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
          {content}
        </a>
      );
    }
    return (
      <Link to={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
