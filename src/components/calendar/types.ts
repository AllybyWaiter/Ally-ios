/**
 * Calendar Type Definitions
 */

import { Droplets, Filter, Wrench, TestTube, Fish, Sparkles, Circle, type LucideIcon } from 'lucide-react';

export interface CalendarTask {
  id: string;
  task_name: string;
  task_type: string;
  due_date: string;
  status: string;
  aquarium_id: string;
  notes?: string | null;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_days?: number | null;
  completed_date?: string | null;
  aquarium?: {
    id: string;
    name: string;
    type?: string;
  };
}

export interface TaskTypeConfig {
  color: string;
  bgColor: string;
  icon: LucideIcon;
  label: string;
}

export const TASK_TYPE_CONFIGS: Record<string, TaskTypeConfig> = {
  water_change: {
    color: 'text-primary',
    bgColor: 'bg-primary',
    icon: Droplets,
    label: 'Water Change',
  },
  filter_maintenance: {
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
    icon: Filter,
    label: 'Filter Maintenance',
  },
  equipment_maintenance: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    icon: Wrench,
    label: 'Equipment',
  },
  testing: {
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    icon: TestTube,
    label: 'Testing',
  },
  feeding: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    icon: Fish,
    label: 'Feeding',
  },
  cleaning: {
    color: 'text-secondary',
    bgColor: 'bg-secondary',
    icon: Sparkles,
    label: 'Cleaning',
  },
  other: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: Circle,
    label: 'Other',
  },
};

export function getTaskTypeConfig(taskType: string): TaskTypeConfig {
  return TASK_TYPE_CONFIGS[taskType] || TASK_TYPE_CONFIGS.other;
}
