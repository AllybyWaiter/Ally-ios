import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TestTube, 
  Fish, 
  Leaf, 
  BarChart2, 
  MessageCircle,
  Wrench,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickAction {
  type: 'log_test' | 'create_task' | 'view_history' | 'add_livestock' | 'add_plant' | 'add_equipment' | 'follow_up';
  label: string;
  payload?: Record<string, unknown>;
}

interface QuickActionChipsProps {
  actions: QuickAction[];
  aquariumId?: string | null;
  onFollowUp?: (question: string) => void;
}

const actionConfig: Record<QuickAction['type'], { 
  icon: typeof Calendar; 
  route?: string;
  colorClass: string;
}> = {
  log_test: { 
    icon: TestTube, 
    route: '/water-tests',
    colorClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20',
  },
  create_task: { 
    icon: Calendar, 
    route: '/calendar',
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20',
  },
  view_history: { 
    icon: BarChart2, 
    route: '/water-tests',
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20',
  },
  add_livestock: { 
    icon: Fish, 
    colorClass: 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20',
  },
  add_plant: { 
    icon: Leaf, 
    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
  },
  add_equipment: { 
    icon: Wrench, 
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20',
  },
  follow_up: { 
    icon: MessageCircle, 
    colorClass: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
};

// Detect actionable content in AI response
export function detectQuickActions(content: string, aquariumId?: string | null): QuickAction[] {
  const actions: QuickAction[] = [];
  const lowerContent = content.toLowerCase();

  // Detect water test suggestions
  if (
    lowerContent.includes('test your water') ||
    lowerContent.includes('water test') ||
    lowerContent.includes('check your parameters') ||
    lowerContent.includes('measure your')
  ) {
    actions.push({ type: 'log_test', label: 'Log Water Test' });
  }

  // Detect task/schedule suggestions
  if (
    lowerContent.includes('water change') ||
    lowerContent.includes('schedule') ||
    lowerContent.includes('reminder') ||
    lowerContent.includes('maintenance')
  ) {
    actions.push({ type: 'create_task', label: 'Schedule Task' });
  }

  // Detect trend/history mentions
  if (
    lowerContent.includes('trend') ||
    lowerContent.includes('history') ||
    lowerContent.includes('over time') ||
    lowerContent.includes('chart')
  ) {
    actions.push({ type: 'view_history', label: 'View History' });
  }

  // Limit to 3 actions
  return actions.slice(0, 3);
}

export const QuickActionChips = React.memo(function QuickActionChips({
  actions,
  aquariumId,
  onFollowUp,
}: QuickActionChipsProps) {
  const navigate = useNavigate();

  if (actions.length === 0) return null;

  const handleAction = (action: QuickAction) => {
    const config = actionConfig[action.type];
    
    if (action.type === 'follow_up' && onFollowUp && action.payload?.question) {
      onFollowUp(action.payload.question as string);
      return;
    }

    if (config.route) {
      const params = new URLSearchParams();
      if (aquariumId) params.set('aquariumId', aquariumId);
      navigate(`${config.route}${params.toString() ? `?${params}` : ''}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, index) => {
        const config = actionConfig[action.type];
        const Icon = config.icon;
        
        return (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium transition-colors",
              config.colorClass
            )}
            onClick={() => handleAction(action)}
          >
            <Icon className="h-3 w-3 mr-1.5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
});
