import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatParameter, UnitSystem } from '@/lib/unitConversions';

interface ParameterCardProps {
  name: string;
  value: number | null;
  unit: string;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated?: string;
  units: UnitSystem;
  onClick?: () => void;
  sparklineData?: number[];
}

export function ParameterCard({
  name,
  value,
  unit,
  status,
  trend,
  lastUpdated,
  units,
  onClick,
  sparklineData,
}: ParameterCardProps) {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'good':
        return {
          bgClass: 'bg-success/10 border-success/30',
          textClass: 'text-success',
          icon: CheckCircle2,
          ringColor: 'hsl(142 76% 36%)',
        };
      case 'warning':
        return {
          bgClass: 'bg-warning/10 border-warning/30',
          textClass: 'text-warning',
          icon: AlertTriangle,
          ringColor: 'hsl(38 92% 50%)',
        };
      case 'critical':
        return {
          bgClass: 'bg-destructive/10 border-destructive/30',
          textClass: 'text-destructive',
          icon: AlertTriangle,
          ringColor: 'hsl(0 84% 60%)',
        };
      default:
        return {
          bgClass: 'bg-muted border-border',
          textClass: 'text-muted-foreground',
          icon: Minus,
          ringColor: 'hsl(224 20% 50%)',
        };
    }
  }, [status]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const StatusIcon = statusConfig.icon;

  // Simple sparkline SVG
  const sparklinePath = useMemo(() => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 60;
    const height = 24;
    const padding = 2;

    const points = sparklineData.map((val, i) => {
      const x = padding + (i / (sparklineData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [sparklineData]);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border text-left transition-all',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50',
        statusConfig.bgClass
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{name}</p>
          <div className="flex items-baseline gap-1 mt-1">
            {value !== null ? (
              <>
                <span className="text-2xl font-bold">{formatParameter(value, unit, units)}</span>
              </>
            ) : (
              <span className="text-lg text-muted-foreground">—</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusIcon className={cn('w-5 h-5', statusConfig.textClass)} />
          {sparklinePath && (
            <svg width="60" height="24" className="opacity-70">
              <path
                d={sparklinePath}
                fill="none"
                stroke={statusConfig.ringColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {trend && value !== null && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <TrendIcon className="w-3 h-3" />
          <span className="capitalize">{trend}</span>
        </div>
      )}
    </motion.button>
  );
}
