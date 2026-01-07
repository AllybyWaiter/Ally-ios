import { format } from 'date-fns';
import { Droplets, AlertTriangle, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HealthRing } from '@/components/aquarium/HealthRing';
import { formatRelativeTime } from '@/lib/formatters';

interface WaterQualityHeroProps {
  aquariums: Array<{ id: string; name: string; type: string }>;
  selectedAquarium: { id: string; name: string; type: string } | null;
  onAquariumChange: (aquarium: { id: string; name: string; type: string }) => void;
  healthScore: number;
  healthLabel: string;
  healthColor: string;
  lastTestDate: string | null;
  alerts: Array<{ parameter: string; status: string }>;
  isLoading?: boolean;
}

export function WaterQualityHero({
  aquariums,
  selectedAquarium,
  onAquariumChange,
  healthScore,
  healthLabel,
  healthColor,
  lastTestDate,
  alerts,
  isLoading,
}: WaterQualityHeroProps) {
  const { t } = useTranslation();

  const criticalAlerts = alerts.filter((a) => a.status === 'critical');
  const warningAlerts = alerts.filter((a) => a.status === 'warning');
  const goodCount = alerts.filter((a) => a.status === 'good').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        {/* Health Ring */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          <HealthRing
            score={healthScore}
            color={healthColor}
            size={140}
            strokeWidth={10}
            label={healthLabel}
            animate
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Aquarium Selector */}
          <div className="flex items-center gap-3">
            <Droplets className="w-5 h-5 text-primary" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-xl font-semibold hover:bg-transparent hover:text-primary"
                >
                  {selectedAquarium?.name || t('waterTests.selectAquarium')}
                  <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {aquariums.map((aquarium) => (
                  <DropdownMenuItem
                    key={aquarium.id}
                    onClick={() => onAquariumChange(aquarium)}
                    className={selectedAquarium?.id === aquarium.id ? 'bg-primary/10' : ''}
                  >
                    <span className="font-medium">{aquarium.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground capitalize">
                      {aquarium.type}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Last Test Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {lastTestDate ? (
              <span>
                {t('waterTests.lastTested')} {formatRelativeTime(lastTestDate)}
              </span>
            ) : (
              <span>{t('waterTests.noTestsYet')}</span>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {criticalAlerts.length} {t('waterTests.critical')}
              </Badge>
            )}
            {warningAlerts.length > 0 && (
              <Badge className="gap-1 bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
                <AlertTriangle className="w-3 h-3" />
                {warningAlerts.length} {t('waterTests.needsAttention')}
              </Badge>
            )}
            {goodCount > 0 && criticalAlerts.length === 0 && warningAlerts.length === 0 && (
              <Badge className="gap-1 bg-success/20 text-success border-success/30 hover:bg-success/30">
                <CheckCircle2 className="w-3 h-3" />
                {t('waterTests.allParametersGood')}
              </Badge>
            )}
            {alerts.length === 0 && !isLoading && (
              <Badge variant="secondary" className="gap-1">
                {t('waterTests.logFirstTest')}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
