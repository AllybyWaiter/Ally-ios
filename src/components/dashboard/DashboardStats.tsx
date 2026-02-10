import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Calendar, Shield, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatVolume, UnitSystem } from '@/lib/unitConversions';
import { useNavigate } from 'react-router-dom';
import AnimatedCounter from '@/components/AnimatedCounter';

interface DashboardStatsProps {
  aquariumsOnly: Array<{ type: string; volume_gallons: number; status: string }>;
  poolsOnly: Array<{ type: string; volume_gallons: number; status: string }>;
  totalVolume: number;
  upcomingTaskCount: number;
  units: UnitSystem;
  isAdmin: boolean;
  hasStaffRole: boolean;
}

export function DashboardStats({
  aquariumsOnly,
  poolsOnly,
  totalVolume,
  upcomingTaskCount,
  units,
  isAdmin,
  hasStaffRole,
}: DashboardStatsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const totalCount = aquariumsOnly.length + poolsOnly.length;
  const totalActiveCount = [...aquariumsOnly, ...poolsOnly].filter(a => a.status === 'active').length;

  // Build a compact breakdown subtitle for mixed users
  const getSubtitle = () => {
    if (aquariumsOnly.length > 0 && poolsOnly.length > 0) {
      const aqLabel = aquariumsOnly.length === 1 ? t('dashboard.statAquarium') : t('dashboard.statAquariums');
      const poolLabel = poolsOnly.length === 1 ? t('dashboard.statPool') : t('dashboard.statPools');
      return `${aquariumsOnly.length} ${aqLabel}, ${poolsOnly.length} ${poolLabel}`;
    }
    return `${totalActiveCount} ${t('dashboard.active')}`;
  };

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
      {/* Unified Aquatic Spaces Card */}
      <Card
        className="glass-card animate-fade-up opacity-0"
        style={{ animationDelay: getAnimationDelay(0) }}
        role="region"
        aria-label={t('dashboard.totalAquariums')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.totalAquariums')}
          </CardTitle>
          <div className="icon-glow" aria-hidden="true">
            <Waves className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold" aria-live="polite">
            <AnimatedCounter end={totalCount} duration={1500} />
          </div>
          <p className="text-xs text-muted-foreground">
            {getSubtitle()}
          </p>
        </CardContent>
      </Card>

      <Card
        className="glass-card animate-fade-up opacity-0"
        style={{ animationDelay: getAnimationDelay(1) }}
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
        style={{ animationDelay: getAnimationDelay(2) }}
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
          style={{ animationDelay: getAnimationDelay(3) }}
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
