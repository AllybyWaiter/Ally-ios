import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, AlertTriangle, CheckCircle2, Clock, ChevronDown, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HealthRing } from '@/components/aquarium/HealthRing';
import { formatRelativeTime } from '@/lib/formatters';
import { formatWaterBodyType } from '@/lib/waterBodyUtils';

interface WaterQualityHeroProps {
  aquariums: Array<{ id: string; name: string; type: string }>;
  selectedAquarium: { id: string; name: string; type: string } | null;
  onAquariumChange: (aquarium: { id: string; name: string; type: string }) => void;
  healthScore: number;
  healthLabel: string;
  healthColor: string;
  lastTestDate: string | null;
  alerts: Array<{ parameter: string; status: string; value?: number | null; unit?: string | null }>;
  onAlertParameterClick?: (parameter: string) => void;
  onLogFirstTest?: () => void;
  isLoading?: boolean;
}

type AlertItem = {
  parameter: string;
  status: string;
  value?: number | null;
  unit?: string | null;
};

export function WaterQualityHero({
  aquariums,
  selectedAquarium,
  onAquariumChange,
  healthScore,
  healthLabel,
  healthColor,
  lastTestDate,
  alerts,
  onAlertParameterClick,
  onLogFirstTest,
  isLoading,
}: WaterQualityHeroProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const criticalAlerts = alerts.filter((a) => a?.status === 'critical');
  const warningAlerts = alerts.filter((a) => a?.status === 'warning');
  const attentionAlerts = alerts.filter((a) => a?.status === 'warning' || a?.status === 'critical');
  const goodCount = alerts.filter((a) => a?.status === 'good').length;

  const formatAlertValue = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  };

  const handleAlertClick = (parameter: string) => {
    setIsAlertDialogOpen(false);
    onAlertParameterClick?.(parameter);
  };

  const buildAskAllyPrompt = (alert: AlertItem) => {
    const waterBodyName = selectedAquarium?.name || 'my aquatic space';
    const waterBodyType = selectedAquarium?.type
      ? formatWaterBodyType(selectedAquarium.type, t)
      : 'aquatic system';
    const formattedValue = formatAlertValue(alert.value);
    const reading = formattedValue
      ? `${formattedValue}${alert.unit ? ` ${alert.unit}` : ''}`
      : 'an out-of-range reading';

    return `My ${waterBodyType} "${waterBodyName}" has ${alert.parameter} at ${reading} (${alert.status}). Give me the likely causes and a safe step-by-step fix plan with what to do now, what to retest next, and target range.`;
  };

  const handleAskAlly = (alert: AlertItem) => {
    setIsAlertDialogOpen(false);
    navigate('/ally', {
      state: {
        prefillMessage: buildAskAllyPrompt(alert),
        context: {
          source: 'water-tests-alert',
          parameter: alert.parameter,
          status: alert.status,
          value: alert.value ?? null,
          unit: alert.unit ?? null,
          aquariumId: selectedAquarium?.id ?? null,
          aquariumName: selectedAquarium?.name ?? null,
        },
      },
    });
  };

  return (
    <>
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
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatWaterBodyType(aquarium.type, t)}
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
                <button
                  type="button"
                  onClick={() => setIsAlertDialogOpen(true)}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`${criticalAlerts.length} ${t('waterTests.critical')}`}
                >
                  <Badge variant="destructive" className="gap-1 cursor-pointer">
                    <AlertTriangle className="w-3 h-3" />
                    {criticalAlerts.length} {t('waterTests.critical')}
                  </Badge>
                </button>
              )}
              {warningAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAlertDialogOpen(true)}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`${warningAlerts.length} ${t('waterTests.needsAttention')}`}
                >
                  <Badge className="gap-1 bg-warning/20 text-warning border-warning/30 hover:bg-warning/30 cursor-pointer">
                    <AlertTriangle className="w-3 h-3" />
                    {warningAlerts.length} {t('waterTests.needsAttention')}
                  </Badge>
                </button>
              )}
              {goodCount > 0 && criticalAlerts.length === 0 && warningAlerts.length === 0 && (
                <Badge className="gap-1 bg-success/20 text-success border-success/30 hover:bg-success/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('waterTests.allParametersGood')}
                </Badge>
              )}
              {alerts.length === 0 && !isLoading && (
                <button
                  type="button"
                  onClick={onLogFirstTest}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
                    {t('waterTests.logFirstTest')}
                  </Badge>
                </button>
              )}
              {/* Fallback: alerts exist but none match good/warning/critical */}
              {alerts.length > 0 && goodCount === 0 && criticalAlerts.length === 0 && warningAlerts.length === 0 && (
                <Badge variant="secondary" className="gap-1">
                  {t('waterTests.parametersLogged', { count: alerts.length })}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-md p-0 gap-0 overflow-hidden",
          criticalAlerts.length > 0
            ? "bg-gradient-to-b from-destructive/8 to-background"
            : "bg-gradient-to-b from-amber-500/8 to-background"
        )}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <DialogHeader className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-full",
                  criticalAlerts.length > 0
                    ? "bg-destructive/15 text-destructive"
                    : "bg-amber-500/15 text-amber-500"
                )}>
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base">{t('waterTests.alertDetailsTitle')}</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">{t('waterTests.alertDetailsDescription')}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Alert cards */}
          <div className="px-5 pb-5 space-y-3 max-h-[50vh] overflow-y-auto">
            {attentionAlerts.map((alert) => {
              const isCritical = alert.status === 'critical';
              const formattedValue = formatAlertValue(alert.value);

              return (
                <motion.div
                  key={`${alert.parameter}-${alert.status}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAlertClick(alert.parameter)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleAlertClick(alert.parameter);
                    }
                  }}
                  className={cn(
                    "w-full text-left rounded-xl p-3.5 transition-all cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "active:scale-[0.98]",
                    isCritical
                      ? "bg-destructive/5 border border-destructive/20 hover:bg-destructive/10"
                      : "bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{alert.parameter}</p>
                      {formattedValue && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('waterTests.latestReading')}: <span className="font-medium text-foreground/70">{formattedValue} {alert.unit || ''}</span>
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5",
                        isCritical
                          ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      )}
                    >
                      {isCritical ? t('waterTests.critical') : t('waterTests.warning')}
                    </Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-full text-xs font-medium bg-background/60 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background/80"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAlertClick(alert.parameter);
                      }}
                    >
                      {t('waterTests.viewTrend')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-full text-xs font-medium gap-1.5 bg-primary/80 backdrop-blur-sm shadow-sm hover:bg-primary/90"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAskAlly(alert);
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t('waterTests.askAlly')}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
