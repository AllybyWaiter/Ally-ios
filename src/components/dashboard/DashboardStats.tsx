import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Calendar, Shield, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatVolume, UnitSystem } from '@/lib/unitConversions';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {/* Aquariums Card - show if has aquariums */}
      {(hasOnlyAquariums || hasMixed) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {hasMixed ? t('dashboard.aquariums') : t('dashboard.totalAquariums')}
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aquariumsOnly.length}</div>
            <p className="text-xs text-muted-foreground">
              {aquariumActiveCount} {t('dashboard.active')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pools Card - show if has pools */}
      {(hasOnlyPools || hasMixed) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {hasMixed ? t('dashboard.poolsAndSpas') : t('dashboard.totalPools')}
            </CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{poolsOnly.length}</div>
            <p className="text-xs text-muted-foreground">
              {poolActiveCount} {t('dashboard.active')}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.totalVolume')}</CardTitle>
          <Droplets className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatVolume(totalVolume, units)}
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.combinedCapacity')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.upcomingTasks')}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingTaskCount}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.tasksDueThisWeek')}</p>
        </CardContent>
      </Card>

      {hasStaffRole && (
        <Card 
          className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10" 
          onClick={() => navigate('/admin')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isAdmin ? 'Admin Panel' : 'Dashboard'}
            </CardTitle>
            <CardDescription>
              {isAdmin ? 'Manage users, content, and system settings' : 'Access your management tools'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
