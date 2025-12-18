import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TestTube, 
  Fish, 
  Leaf, 
  BarChart2, 
  Wrench,
  Droplets,
  AlertTriangle,
  Thermometer,
  Clock,
  Beaker,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface QuickAction {
  type: 
    | 'log_test' 
    | 'create_task' 
    | 'view_history' 
    | 'add_livestock' 
    | 'add_plant' 
    | 'add_equipment'
    | 'schedule_water_change'
    | 'check_ammonia'
    | 'check_temperature'
    | 'schedule_maintenance'
    | 'dose_treatment'
    | 'water_change_reminder';
  label: string;
  payload?: Record<string, unknown>;
}

interface QuickActionChipsProps {
  actions: QuickAction[];
  aquariumId?: string | null;
  onAction?: (action: QuickAction) => void;
}

const actionConfig: Record<QuickAction['type'], { 
  icon: typeof Calendar; 
  route?: string;
  colorClass: string;
  toastMessage?: string;
}> = {
  log_test: { 
    icon: TestTube, 
    route: '/water-tests',
    colorClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/20',
  },
  create_task: { 
    icon: Calendar, 
    route: '/calendar',
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20',
  },
  view_history: { 
    icon: BarChart2, 
    route: '/water-tests',
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border-purple-500/20',
  },
  add_livestock: { 
    icon: Fish, 
    colorClass: 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20',
  },
  add_plant: { 
    icon: Leaf, 
    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20',
  },
  add_equipment: { 
    icon: Wrench, 
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 border-slate-500/20',
  },
  schedule_water_change: {
    icon: Droplets,
    route: '/calendar',
    colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 border-sky-500/20',
    toastMessage: 'Opening calendar to schedule water change...',
  },
  check_ammonia: {
    icon: AlertTriangle,
    route: '/water-tests',
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20',
  },
  check_temperature: {
    icon: Thermometer,
    route: '/water-tests',
    colorClass: 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-red-500/20',
  },
  schedule_maintenance: {
    icon: Clock,
    route: '/calendar',
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20',
  },
  dose_treatment: {
    icon: Beaker,
    colorClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 border-pink-500/20',
    toastMessage: 'Log dosing in your water test notes',
  },
  water_change_reminder: {
    icon: RefreshCw,
    route: '/calendar',
    colorClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 border-teal-500/20',
  },
};

// Enhanced detection of actionable content in AI response
export function detectQuickActions(content: string, aquariumId?: string | null): QuickAction[] {
  const actions: QuickAction[] = [];
  const lowerContent = content.toLowerCase();
  const addedTypes = new Set<string>();

  // Helper to add action only once
  const addAction = (type: QuickAction['type'], label: string, payload?: Record<string, unknown>) => {
    if (!addedTypes.has(type)) {
      addedTypes.add(type);
      actions.push({ type, label, payload });
    }
  };

  // Water change suggestions (high priority)
  if (
    lowerContent.includes('water change') ||
    lowerContent.includes('partial water change') ||
    lowerContent.includes('pwc') ||
    lowerContent.includes('change 25%') ||
    lowerContent.includes('change 50%') ||
    lowerContent.includes('weekly water change')
  ) {
    // Extract percentage if mentioned
    const percentMatch = content.match(/(\d{1,2})%\s*(?:water\s*)?change/i);
    const percent = percentMatch ? parseInt(percentMatch[1]) : undefined;
    addAction('schedule_water_change', percent ? `Schedule ${percent}% Water Change` : 'Schedule Water Change', { percent });
  }

  // Ammonia/nitrogen cycle issues
  if (
    lowerContent.includes('ammonia') ||
    lowerContent.includes('nitrite spike') ||
    lowerContent.includes('nitrogen cycle') ||
    lowerContent.includes('new tank syndrome')
  ) {
    addAction('check_ammonia', 'Test Ammonia Levels');
  }

  // Temperature issues
  if (
    lowerContent.includes('temperature') ||
    lowerContent.includes('heater') ||
    lowerContent.includes('too cold') ||
    lowerContent.includes('too warm') ||
    lowerContent.includes('thermal')
  ) {
    addAction('check_temperature', 'Check Temperature');
  }

  // General water testing suggestions
  if (
    lowerContent.includes('test your water') ||
    lowerContent.includes('water test') ||
    lowerContent.includes('check your parameters') ||
    lowerContent.includes('measure your') ||
    lowerContent.includes('test kit') ||
    lowerContent.includes('api test') ||
    lowerContent.includes('check ph') ||
    lowerContent.includes('check nitrate')
  ) {
    addAction('log_test', 'Log Water Test');
  }

  // Task/schedule/maintenance suggestions
  if (
    lowerContent.includes('schedule') ||
    lowerContent.includes('reminder') ||
    lowerContent.includes('set a reminder') ||
    lowerContent.includes('don\'t forget to') ||
    lowerContent.includes('make sure to') ||
    lowerContent.includes('regular maintenance')
  ) {
    addAction('schedule_maintenance', 'Create Reminder');
  }

  // Filter/equipment maintenance
  if (
    lowerContent.includes('clean the filter') ||
    lowerContent.includes('filter maintenance') ||
    lowerContent.includes('replace filter') ||
    lowerContent.includes('clean your filter') ||
    lowerContent.includes('rinse the filter')
  ) {
    addAction('create_task', 'Schedule Filter Cleaning');
  }

  // Dosing/treatment suggestions
  if (
    lowerContent.includes('dose') ||
    lowerContent.includes('treatment') ||
    lowerContent.includes('medication') ||
    lowerContent.includes('prime') ||
    lowerContent.includes('seachem') ||
    lowerContent.includes('add salt') ||
    lowerContent.includes('aquarium salt')
  ) {
    addAction('dose_treatment', 'Log Treatment');
  }

  // Trend/history analysis
  if (
    lowerContent.includes('trend') ||
    lowerContent.includes('history') ||
    lowerContent.includes('over time') ||
    lowerContent.includes('chart') ||
    lowerContent.includes('pattern') ||
    lowerContent.includes('historically')
  ) {
    addAction('view_history', 'View Trends');
  }

  // Adding livestock suggestions
  if (
    lowerContent.includes('add fish') ||
    lowerContent.includes('new fish') ||
    lowerContent.includes('quarantine') ||
    lowerContent.includes('adding livestock') ||
    lowerContent.includes('stock your tank')
  ) {
    addAction('add_livestock', 'Add Fish');
  }

  // Adding plants suggestions
  if (
    lowerContent.includes('add plants') ||
    lowerContent.includes('new plant') ||
    lowerContent.includes('planting') ||
    lowerContent.includes('planted tank')
  ) {
    addAction('add_plant', 'Add Plant');
  }

  // Limit to 3 most relevant actions
  return actions.slice(0, 3);
}

export const QuickActionChips = React.memo(function QuickActionChips({
  actions,
  aquariumId,
  onAction,
}: QuickActionChipsProps) {
  const navigate = useNavigate();

  if (actions.length === 0) return null;

  const handleAction = (action: QuickAction) => {
    const config = actionConfig[action.type];
    
    // Notify parent if handler provided
    if (onAction) {
      onAction(action);
    }

    // Actions that require an aquariumId
    const requiresAquarium = ['add_livestock', 'add_plant', 'add_equipment', 'dose_treatment'];
    if (requiresAquarium.includes(action.type) && !aquariumId) {
      toast.info('Please select an aquarium first from your dashboard');
      navigate('/dashboard');
      return;
    }

    // Show toast if configured
    if (config.toastMessage) {
      toast.info(config.toastMessage);
    }

    // Handle dynamic routes (require aquariumId in path)
    if (action.type === 'add_livestock') {
      navigate(`/aquarium/${aquariumId}?tab=livestock&addNew=livestock`);
      return;
    }
    if (action.type === 'add_plant') {
      navigate(`/aquarium/${aquariumId}?tab=livestock&addNew=plant`);
      return;
    }
    if (action.type === 'add_equipment') {
      navigate(`/aquarium/${aquariumId}?tab=equipment&addNew=true`);
      return;
    }
    if (action.type === 'dose_treatment') {
      navigate(`/water-tests?aquariumId=${aquariumId}&tab=log&addNote=treatment`);
      return;
    }

    // Navigate if route exists
    if (config.route) {
      const params = new URLSearchParams();
      if (aquariumId) params.set('aquariumId', aquariumId);
      
      // Add action-specific params
      if (action.type === 'schedule_water_change') {
        params.set('newTask', 'true');
        params.set('taskType', 'water_change');
        if (action.payload?.percent) {
          params.set('taskName', `${action.payload.percent}% Water Change`);
        }
      }
      if (action.type === 'create_task' || action.type === 'schedule_maintenance') {
        params.set('newTask', 'true');
      }
      if (action.type === 'view_history') {
        params.set('tab', 'charts');
      }
      
      navigate(`${config.route}${params.toString() ? `?${params}` : ''}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/50">
      <span className="text-xs text-muted-foreground w-full mb-1">Quick actions:</span>
      {actions.map((action, index) => {
        const config = actionConfig[action.type];
        const Icon = config.icon;
        
        return (
          <Button
            key={`${action.type}-${index}`}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs font-medium transition-all border",
              config.colorClass
            )}
            onClick={() => handleAction(action)}
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
});
