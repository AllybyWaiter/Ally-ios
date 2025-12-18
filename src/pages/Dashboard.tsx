import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { PreferencesOnboarding } from '@/components/PreferencesOnboarding';
import { AquariumOnboarding } from '@/components/AquariumOnboarding';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';
import { AquariumDialog } from '@/components/aquarium/AquariumDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh-indicator';
import { DashboardStats, AllyCTA, AquariumGrid, useDashboardData, WeatherStatsCard } from '@/components/dashboard';
import { TrendAlertsBanner } from '@/components/dashboard/TrendAlertsBanner';
import { DashboardBackground, DashboardGreeting } from '@/components/dashboard/DashboardHeroBanner';
import { SectionErrorBoundary } from '@/components/error-boundaries';
import { FeatureArea } from '@/lib/sentry';

interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  status: string;
  setup_date: string;
  notes: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, hasPermission, hasAnyRole, units, onboardingCompleted, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { limits, canCreateAquarium, getRemainingAquariums, getUpgradeSuggestion, tier, loading: limitsLoading } = usePlanLimits();
  
  const {
    loading,
    setLoading,
    dataFetched,
    aquariums,
    aquariumsOnly,
    poolsOnly,
    hasOnlyAquariums,
    hasOnlyPools,
    hasMixed,
    upcomingTaskCount,
    totalVolume,
    loadAquariums,
    deleteAquarium,
  } = useDashboardData();
  
  const [showPreferencesOnboarding, setShowPreferencesOnboarding] = useState(false);
  const [showAquariumOnboarding, setShowAquariumOnboarding] = useState(false);
  const [aquariumDialogOpen, setAquariumDialogOpen] = useState(false);
  const [editingAquarium, setEditingAquarium] = useState<Aquarium | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAquariumId, setDeletingAquariumId] = useState<string | null>(null);
  
  // Pull-to-refresh
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Memoized handlers
  const handlePullRefresh = useCallback(async () => {
    if (user) {
      await loadAquariums(user.id);
      toast({ 
        title: 'Dashboard refreshed',
        description: `Updated ${new Date().toLocaleTimeString()}`
      });
    }
  }, [user, loadAquariums, toast]);
  
  const { isRefreshing, pullDistance, isPastThreshold } = usePullToRefresh(containerRef, {
    onRefresh: handlePullRefresh,
    threshold: 60,
    disabled: loading || authLoading || !isMobile
  });

  // Memoized computed values
  const hasStaffRole = useMemo(() => 
    hasAnyRole(['admin', 'moderator', 'editor']) || hasPermission('moderate_support'),
    [hasAnyRole, hasPermission]
  );

  const waterBodyMix = useMemo(() => 
    hasOnlyPools ? 'pools' : hasMixed ? 'mixed' : 'aquariums',
    [hasOnlyPools, hasMixed]
  );

  // Hard maximum loading timeout
  useEffect(() => {
    const maxLoadingTimeout = setTimeout(() => {
      if (loading && user && !dataFetched) {
        console.warn('Dashboard: Max 4s timeout - forcing data load with userId:', user.id);
        loadAquariums(user.id);
      } else if (loading && user && onboardingCompleted === null) {
        console.warn('Dashboard: Onboarding state unknown after 4s, attempting to load data');
        loadAquariums(user.id);
      } else if (loading) {
        console.warn('Dashboard: Max 4s timeout - forcing completion');
        setLoading(false);
      }
    }, 4000);
    return () => clearTimeout(maxLoadingTimeout);
  }, [user, dataFetched, onboardingCompleted, loading, loadAquariums, setLoading]);

  // iOS PWA wake-up recovery
  useEffect(() => {
    let stuckCheckTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('Dashboard: Visibility changed to visible, checking state...');
        
        if (stuckCheckTimeout) clearTimeout(stuckCheckTimeout);
        
        stuckCheckTimeout = setTimeout(() => {
          if (loading || authLoading) {
            console.warn('Dashboard: Still loading after wake-up, forcing reload');
            window.location.reload();
          } else if (user && aquariums.length === 0 && dataFetched) {
            console.log('Dashboard: Showing empty after wake-up, refreshing data with userId:', user.id);
            loadAquariums(user.id);
          }
        }, 2000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (stuckCheckTimeout) clearTimeout(stuckCheckTimeout);
    };
  }, [loading, authLoading, user, aquariums.length, dataFetched, loadAquariums]);

  // Main data loading effect
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (authLoading || onboardingCompleted === null) {
      return;
    }
    
    if (onboardingCompleted === false) {
      setShowPreferencesOnboarding(true);
      setLoading(false);
      return;
    }
    
    console.log('Dashboard: Main useEffect calling loadAquariums with userId:', user.id);
    loadAquariums(user.id);
  }, [user, navigate, onboardingCompleted, authLoading, loadAquariums, setLoading]);

  // Show aquarium onboarding when no aquariums exist
  useEffect(() => {
    if (dataFetched && aquariums.length === 0 && !showPreferencesOnboarding) {
      setShowAquariumOnboarding(true);
    }
  }, [dataFetched, aquariums.length, showPreferencesOnboarding]);

  // Memoized event handlers
  const handlePreferencesComplete = useCallback(async () => {
    setShowPreferencesOnboarding(false);
    await loadAquariums(user?.id);
  }, [loadAquariums, user?.id]);

  const handleAquariumOnboardingComplete = useCallback(async () => {
    setShowAquariumOnboarding(false);
    await loadAquariums(user?.id);
  }, [loadAquariums, user?.id]);

  const handleCreateAquarium = useCallback(() => {
    if (!canCreateAquarium(aquariums.length)) {
      const upgradeTier = getUpgradeSuggestion();
      toast({
        title: 'Aquarium Limit Reached',
        description: `Your ${tier} plan allows up to ${limits.maxAquariums} aquarium${limits.maxAquariums !== 1 ? 's' : ''}. ${upgradeTier ? `Upgrade to ${upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1)} for more.` : ''}`,
        variant: 'destructive',
      });
      return;
    }
    setEditingAquarium(undefined);
    setAquariumDialogOpen(true);
  }, [canCreateAquarium, aquariums.length, getUpgradeSuggestion, tier, limits.maxAquariums, toast]);

  const handleEditAquarium = useCallback((aquarium: Aquarium) => {
    setEditingAquarium(aquarium);
    setAquariumDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((aquariumId: string) => {
    setDeletingAquariumId(aquariumId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingAquariumId) return;
    await deleteAquarium(deletingAquariumId, user?.id);
    setDeleteDialogOpen(false);
    setDeletingAquariumId(null);
  }, [deletingAquariumId, deleteAquarium, user?.id]);

  if (loading || authLoading) {
    return <DashboardSkeleton />;
  }

  if (showPreferencesOnboarding && user) {
    return (
      <PreferencesOnboarding
        userId={user.id}
        onComplete={handlePreferencesComplete}
      />
    );
  }

  if (showAquariumOnboarding && user) {
    return (
      <AquariumOnboarding
        onComplete={handleAquariumOnboardingComplete}
      />
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen pull-refresh-container relative">
      {/* Full-page time-of-day background */}
      <DashboardBackground />
      
      {/* Content layer */}
      <div className="relative z-10">
        <AppHeader />
        
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          isPastThreshold={isPastThreshold}
          isRefreshing={isRefreshing}
        />
        
        <main className="container mx-auto px-4 py-6 pt-24 pb-20 md:pb-6 mt-safe">
          {/* Personalized Greeting */}
          <DashboardGreeting />

        {/* Trend Alerts Banner */}
        <SectionErrorBoundary fallbackTitle="Failed to load alerts" featureArea={FeatureArea.AQUARIUM}>
          <TrendAlertsBanner />
        </SectionErrorBoundary>

        {/* Weather Stats Card */}
        <SectionErrorBoundary fallbackTitle="Failed to load weather" featureArea={FeatureArea.AQUARIUM}>
          <WeatherStatsCard />
        </SectionErrorBoundary>

        {/* Stats Overview */}
        <SectionErrorBoundary fallbackTitle="Failed to load stats" featureArea={FeatureArea.AQUARIUM}>
          <DashboardStats
            aquariumsOnly={aquariumsOnly}
            poolsOnly={poolsOnly}
            hasOnlyAquariums={hasOnlyAquariums}
            hasOnlyPools={hasOnlyPools}
            hasMixed={hasMixed}
            totalVolume={totalVolume}
            upcomingTaskCount={upcomingTaskCount}
            units={units}
            isAdmin={isAdmin}
            hasStaffRole={hasStaffRole}
          />
        </SectionErrorBoundary>

        {/* Chat with Ally CTA */}
        <SectionErrorBoundary fallbackTitle="Failed to load chat CTA" featureArea={FeatureArea.CHAT}>
          <AllyCTA />
        </SectionErrorBoundary>

        {/* Aquariums Grid */}
        <SectionErrorBoundary fallbackTitle="Failed to load aquariums" featureArea={FeatureArea.AQUARIUM}>
          <AquariumGrid
            aquariums={aquariums}
            units={units}
            canCreate={canCreateAquarium(aquariums.length)}
            maxAquariums={limits.maxAquariums}
            limitsLoading={limitsLoading}
            waterBodyMix={waterBodyMix}
            onCreateAquarium={handleCreateAquarium}
            onEditAquarium={handleEditAquarium}
            onDeleteAquarium={handleDeleteClick}
          />
        </SectionErrorBoundary>
        </main>
      </div>

      <AquariumDialog
        open={aquariumDialogOpen}
        onOpenChange={setAquariumDialogOpen}
        onSuccess={loadAquariums}
        aquarium={editingAquarium}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.deleteAquarium')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
