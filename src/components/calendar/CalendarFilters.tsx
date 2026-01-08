/**
 * Calendar Filters Component
 * 
 * Smart filtering system for the calendar view.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Droplets, Wrench, TestTube, Fish, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const TASK_TYPE_FILTERS = [
  { id: 'water_change', label: 'Water Change', icon: Droplets, color: 'text-primary' },
  { id: 'filter_maintenance', label: 'Filter', icon: Filter, color: 'text-purple-500' },
  { id: 'equipment', label: 'Equipment', icon: Wrench, color: 'text-orange-500' },
  { id: 'testing', label: 'Testing', icon: TestTube, color: 'text-green-500' },
  { id: 'feeding', label: 'Feeding', icon: Fish, color: 'text-yellow-500' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-sand' },
] as const;

const STATUS_FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
] as const;

export interface CalendarFilterState {
  taskTypes: string[];
  statuses: string[];
  aquariumIds: string[];
}

interface CalendarFiltersProps {
  filters: CalendarFilterState;
  onFiltersChange: (filters: CalendarFilterState) => void;
  aquariums?: Array<{ id: string; name: string }>;
}

export function CalendarFilters({
  filters,
  onFiltersChange,
  aquariums = [],
}: CalendarFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = 
    filters.taskTypes.length + 
    filters.statuses.length + 
    filters.aquariumIds.length;

  const toggleTaskType = (typeId: string) => {
    const newTypes = filters.taskTypes.includes(typeId)
      ? filters.taskTypes.filter(t => t !== typeId)
      : [...filters.taskTypes, typeId];
    onFiltersChange({ ...filters, taskTypes: newTypes });
  };

  const toggleStatus = (statusId: string) => {
    const newStatuses = filters.statuses.includes(statusId)
      ? filters.statuses.filter(s => s !== statusId)
      : [...filters.statuses, statusId];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const toggleAquarium = (aquariumId: string) => {
    const newAquariums = filters.aquariumIds.includes(aquariumId)
      ? filters.aquariumIds.filter(a => a !== aquariumId)
      : [...filters.aquariumIds, aquariumId];
    onFiltersChange({ ...filters, aquariumIds: newAquariums });
  };

  const clearFilters = () => {
    onFiltersChange({ taskTypes: [], statuses: [], aquariumIds: [] });
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-2",
              activeFilterCount > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="start" 
          className="w-72 p-0"
          sideOffset={8}
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filters</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Task Type Filters */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Task Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TASK_TYPE_FILTERS.map(type => {
                  const Icon = type.icon;
                  const isActive = filters.taskTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleTaskType(type.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filters */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map(status => {
                  const isActive = filters.statuses.includes(status.id);
                  return (
                    <button
                      key={status.id}
                      onClick={() => toggleStatus(status.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                        status.id === 'overdue' && isActive && "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {isActive && <Check className="w-3 h-3" />}
                      {status.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aquarium Filters */}
            {aquariums.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Aquarium
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {aquariums.map(aquarium => {
                    const isActive = filters.aquariumIds.includes(aquarium.id);
                    return (
                      <button
                        key={aquarium.id}
                        onClick={() => toggleAquarium(aquarium.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                        {aquarium.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges (mobile-friendly) */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 w-7 p-0 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
