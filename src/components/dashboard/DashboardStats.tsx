import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Calendar, Shield, Waves, Fish } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatVolume, UnitSystem } from '@/lib/unitConversions';
import { useNavigate } from 'react-router-dom';
import AnimatedCounter from '@/components/AnimatedCounter';

interface DashboardStatsProps {
  aquariumsOnly: Array<{ type: string; volume_gallons: number; status: string }>;
  poolsOnly: Array<{ type: string; volume_gallons: number; status: string }>;
  hasOnlyAquariums: boolean;
  hasOnlyPools: boolean;
  hasMixed: boolean;
  totalVolume: number;
  upcomingTaskCount: number;
  units: UnitSystem;
  isAdmin: boolean;
  hasStaffRole: boolean;
}

export function DashboardStats({
  aquariumsOnly,
  poolsOnly,
  hasOnlyAquariums,
  hasOnlyPools,
  hasMixed,
  totalVolume,
  upcomingTaskCount,
  units,
  isAdmin,
  hasStaffRole,
}: DashboardStatsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const aquariumActiveCount = aquariumsOnly.filter(a => a.status === 'active').length;
  const poolActiveCount = poolsOnly.filter(a => a.status === 'active').length;

  // Parse volume for animated counter
  const volumeFormatted = formatVolume(totalVolume, units);
  const volumeMatch = volumeFormatted.match(/^([\d,.]+)\s*(.*)$/);
  const parsedVolume = volumeMatch ? parseFloat(volumeMatch[1].replace(',', '')) : totalVolume;
  const volumeNumber = isNaN(parsedVolume) ? 0 : parsedVolume;
  const volumeUnit = volumeMatch ? ` ${volumeMatch[2]}` : '';

  // Use fixed animation delays for consistent behavior
  const getAnimationDelay = (index: number) => `${index * 100}ms`;

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {/* Aquariums Card - show if has aquariums */}
      {(hasOnlyAquariums || hasMixed) && (
        <Card 
          className="glass-card animate-fade-up opacity-0"
          style={{ animationDelay: getAnimationDelay(0) }}
          role="region"
          aria-label={hasMixed ? t('dashboard.aquariums') : t('dashboard.totalAquariums')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {hasMixed ? t('dashboard.aquariums') : t('dashboard.totalAquariums')}
            </CardTitle>
            <div className="icon-glow" aria-hidden="true">
              <Fish className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" aria-live="polite">
              <AnimatedCounter end={aquariumsOnly.length} duration={1500} />
            </div>
            <p className="text-xs text-muted-foreground">
              <AnimatedCounter end={aquariumActiveCount} duration={1500} /> {t('dashboard.active')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pools Card - show if has pools */}
      {(hasOnlyPools || hasMixed) && (
        <Card 
          className="glass-card animate-fade-up opacity-0"
          style={{ animationDelay: getAnimationDelay(hasOnlyAquariums || hasMixed ? 1 : 0) }}
          role="region"
          aria-label={hasMixed ? t('dashboard.poolsAndSpas') : t('dashboard.totalPools')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {hasMixed ? t('dashboard.poolsAndSpas') : t('dashboard.totalPools')}
            </CardTitle>
            <div className="icon-glow" aria-hidden="true">
              <Waves className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" aria-live="polite">
              <AnimatedCounter end={poolsOnly.length} duration={1500} />
            </div>
            <p className="text-xs text-muted-foreground">
              <AnimatedCounter end={poolActiveCount} duration={1500} /> {t('dashboard.active')}
            </p>
          </CardContent>
        </Card>
      )}

      <Card 
        className="glass-card animate-fade-up opacity-0"
        style={{ animationDelay: getAnimationDelay(hasMixed ? 2 : 1) }}
        role="region"
        aria-label={t('dashboard.totalVolume')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.totalVolume')}</CardTitle>
          <div className="icon-glow" aria-hidden="true">
            <Droplets className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold" aria-live="polite">
            <AnimatedCounter end={volumeNumber} duration={1500} suffix={volumeUnit} decimals={0} />
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.combinedCapacity')}</p>
        </CardContent>
      </Card>

      <Card 
        className="glass-card animate-fade-up opacity-0"
        style={{ animationDelay: getAnimationDelay(hasMixed ? 3 : 2) }}
        role="region"
        aria-label={t('dashboard.upcomingTasks')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.upcomingTasks')}</CardTitle>
          <div className="icon-glow" aria-hidden="true">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold" aria-live="polite">
            <AnimatedCounter end={upcomingTaskCount} duration={1500} />
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.tasksDueThisWeek')}</p>
        </CardContent>
      </Card>

      {hasStaffRole && (
        <Card 
          className="glass-card animate-fade-up opacity-0 cursor-pointer border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10" 
          style={{ animationDelay: getAnimationDelay(hasMixed ? 4 : 3) }}
          onClick={() => navigate('/admin')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/admin')}
          role="button"
          tabIndex={0}
          aria-label={isAdmin ? t('dashboard.adminPanel') : t('dashboard.staffDashboard')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="icon-glow" aria-hidden="true">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              {isAdmin ? t('dashboard.adminPanel') : t('dashboard.staffDashboard')}
            </CardTitle>
            <CardDescription>
              {isAdmin ? t('dashboard.adminPanelDescription') : t('dashboard.staffDashboardDescription')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
