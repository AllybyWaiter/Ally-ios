/**
 * Quick Health View Component
 * 
 * Shows aquarium health summary with animated ring,
 * breakdown by category, alerts, and quick actions.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Droplets, 
  Fish, 
  Wrench, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HealthRing } from './HealthRing';
import { useAquariumHealthScore, HealthBreakdown } from '@/hooks/useAquariumHealthScore';
import { formatRelativeTime } from '@/lib/formatters';

interface QuickHealthViewProps {
  aquariumId: string;
  aquariumName: string;
  compact?: boolean;
  onClose?: () => void;
}

interface BreakdownItemProps {
  icon: React.ReactNode;
  label: string;
  score: number;
  compact?: boolean;
}

function BreakdownItem({ icon, label, score, compact }: BreakdownItemProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    if (s >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-1' : 'py-2'}`}>
      <div className="text-muted-foreground">{icon}</div>
      <span className={`flex-1 ${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        {label}
      </span>
      <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${getScoreColor(score)}`}>
        {score}%
      </span>
    </div>
  );
}

function TrendIndicator({ direction, change }: { direction: 'up' | 'down' | 'stable'; change: number }) {
  if (direction === 'stable') {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <Minus className="w-3 h-3" />
        <span>Stable</span>
      </div>
    );
  }

  const isUp = direction === 'up';
  return (
    <div className={`flex items-center gap-1 text-xs ${isUp ? 'text-green-500' : 'text-red-500'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{isUp ? '+' : '-'}{change}%</span>
    </div>
  );
}

export function QuickHealthView({ 
  aquariumId, 
  aquariumName, 
  compact = false,
  onClose 
}: QuickHealthViewProps) {
  const navigate = useNavigate();
  const health = useAquariumHealthScore(aquariumId);

  const handleViewDetails = () => {
    onClose?.();
    navigate(`/aquarium/${aquariumId}`);
  };

  if (health.isLoading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} space-y-4`}>
        <div className="flex items-center justify-center">
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  const breakdownItems: { icon: React.ReactNode; label: string; key: keyof HealthBreakdown }[] = [
    { icon: <Droplets className="w-4 h-4" />, label: 'Water Quality', key: 'waterTests' },
    { icon: <Fish className="w-4 h-4" />, label: 'Livestock Health', key: 'livestockHealth' },
    { icon: <Wrench className="w-4 h-4" />, label: 'Maintenance', key: 'maintenance' },
    { icon: <Activity className="w-4 h-4" />, label: 'Care Consistency', key: 'careConsistency' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Header with name */}
      {!compact && (
        <h3 className="font-semibold text-lg mb-4 text-center">{aquariumName}</h3>
      )}

      {/* Health Ring */}
      <div className="flex justify-center mb-4">
        <HealthRing
          score={health.score}
          color={health.color}
          label={health.label}
          size={compact ? 100 : 120}
          strokeWidth={compact ? 6 : 8}
        />
      </div>

      {/* Trend */}
      <div className="flex justify-center mb-4">
        <TrendIndicator direction={health.trend.direction} change={health.trend.change} />
      </div>

      {/* Alerts Badge */}
      {(health.alerts > 0 || health.overdueTasks > 0) && (
        <div className="flex justify-center gap-2 mb-4">
          {health.alerts > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {health.alerts} Alert{health.alerts > 1 ? 's' : ''}
            </Badge>
          )}
          {health.overdueTasks > 0 && (
            <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-500 border-orange-500/20">
              <Clock className="w-3 h-3" />
              {health.overdueTasks} Overdue
            </Badge>
          )}
        </div>
      )}

      {/* Breakdown */}
      <div className={`border-t border-border ${compact ? 'pt-2' : 'pt-3'}`}>
        {breakdownItems.map((item) => (
          <BreakdownItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            score={health.breakdown[item.key]}
            compact={compact}
          />
        ))}
      </div>

      {/* Last Test Info */}
      {health.lastWaterTest && (
        <div className={`text-xs text-muted-foreground text-center ${compact ? 'mt-2' : 'mt-3'}`}>
          Last test: {formatRelativeTime(health.lastWaterTest)}
        </div>
      )}

      {/* View Details Button */}
      {!compact && (
        <Button 
          onClick={handleViewDetails}
          className="w-full mt-4 gap-2"
          variant="secondary"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}
