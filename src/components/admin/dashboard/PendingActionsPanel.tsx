import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Ticket, 
  Mail, 
  UserPlus,
  FileText,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PendingAction } from '@/hooks/useAdminDashboardStats';

interface PendingActionsPanelProps {
  actions?: PendingAction[];
  isLoading: boolean;
  onNavigate?: (tab: string) => void;
}

const priorityConfig = {
  urgent: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    badgeVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    badgeVariant: 'default' as const,
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    badgeVariant: 'secondary' as const,
  },
};

const typeConfig = {
  ticket: { icon: Ticket, tab: 'tickets' },
  contact: { icon: Mail, tab: 'contacts' },
  beta: { icon: UserPlus, tab: 'beta' },
  blog: { icon: FileText, tab: 'blog' },
  announcement: { icon: AlertCircle, tab: 'announcements' },
};

function ActionItem({ action, onNavigate }: { action: PendingAction; onNavigate?: (tab: string) => void }) {
  const priorityCfg = priorityConfig[action.priority];
  const typeCfg = typeConfig[action.type];
  const TypeIcon = typeCfg.icon;

  return (
    <button
      onClick={() => onNavigate?.(typeCfg.tab)}
      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", priorityCfg.bgColor)}>
          <TypeIcon className={cn("h-4 w-4", priorityCfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{action.title}</span>
            <Badge variant={priorityCfg.badgeVariant} className="text-xs shrink-0">
              {action.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {action.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </button>
  );
}

function ActionSkeleton() {
  return (
    <div className="p-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function PendingActionsPanel({ actions, isLoading, onNavigate }: PendingActionsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Pending Actions
        </CardTitle>
        <CardDescription>
          {actions?.length || 0} items requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="px-4 pb-4 space-y-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <ActionSkeleton key={i} />
              ))
            ) : actions && actions.length > 0 ? (
              actions.map(action => (
                <ActionItem key={action.id} action={action} onNavigate={onNavigate} />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending actions</p>
                <p className="text-xs">Everything is up to date!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
