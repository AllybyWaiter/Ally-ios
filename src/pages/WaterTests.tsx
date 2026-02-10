import { useState, Suspense, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { WaterTestCharts } from "@/components/water-tests/WaterTestCharts";
import { WaterQualityHero } from "@/components/water-tests/WaterQualityHero";
import { QuickLogSection } from "@/components/water-tests/QuickLogSection";
import { ParameterInsightsGrid } from "@/components/water-tests/ParameterInsightsGrid";
import { RecentActivityTimeline } from "@/components/water-tests/RecentActivityTimeline";
import { queryKeys } from "@/lib/queryKeys";
import { SectionErrorBoundary } from "@/components/error-boundaries";
import { FeatureArea } from "@/lib/sentry";
import { WaterTestChartsSkeleton } from "@/components/water-tests/WaterTestSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useAquariumHealthScore } from "@/hooks/useAquariumHealthScore";
import { fetchAllWaterTests } from "@/infrastructure/queries/waterTests";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const WaterTests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAquariumId = searchParams.get('aquariumId');
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(urlAquariumId);
  const [selectedParameter, setSelectedParameter] = useState<string>("pH");
  const { t } = useTranslation();
  const { units } = useProfileContext();
  const { user, loading: authLoading } = useAuth();

  const {
    data: aquariums,
    isLoading: aquariumsLoading,
    isError: aquariumsError,
    refetch: refetchAquariums,
  } = useQuery({
    queryKey: queryKeys.aquariums.all,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("aquariums")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !authLoading && !!user,
  });

  // Auto-select aquarium from URL param or first available
  // Also validates that current selection still exists (handles async deletion)
  useEffect(() => {
    if (aquariums && aquariums.length > 0) {
      // Check if URL param aquarium exists
      if (urlAquariumId && aquariums.some(a => a.id === urlAquariumId)) {
        setSelectedAquariumId(urlAquariumId);
        return;
      }
      // Use callback form to access current state without adding to dependencies
      setSelectedAquariumId(current => {
        // Check if current selection still exists, otherwise reset to first
        if (current && !aquariums.some(a => a.id === current)) {
          return aquariums[0].id;
        }
        // No selection yet, select first
        if (!current) {
          return aquariums[0].id;
        }
        return current;
      });
    } else if (aquariums && aquariums.length === 0) {
      // All aquariums deleted, clear selection
      setSelectedAquariumId(null);
    }
  }, [aquariums, urlAquariumId]);

  const selectedAquarium = aquariums?.find((a) => a.id === selectedAquariumId);

  // Fetch health score data
  const healthData = useAquariumHealthScore(selectedAquariumId || '');

  // Fetch recent water tests
  const { data: testsData } = useQuery({
    queryKey: ['water-tests-recent', selectedAquariumId],
    queryFn: () => fetchAllWaterTests(selectedAquariumId!, 20),
    enabled: !!selectedAquariumId,
  });

  // Build alerts from latest test parameters
  const parameterAlerts = useMemo(() => {
    if (!testsData?.length) return [];
    const latest = testsData[0];
    const validStatuses = ['good', 'warning', 'critical'] as const;
    return latest.test_parameters?.map(p => {
      // Safely validate status is one of the expected values
      const status = validStatuses.includes(p.status as typeof validStatuses[number])
        ? (p.status as 'good' | 'warning' | 'critical')
        : 'unknown';
      return { parameter: p.parameter_name, status, value: p.value, unit: p.unit };
    }) || [];
  }, [testsData]);

  const handleAquariumChange = (aquarium: { id: string }) => {
    setSelectedAquariumId(aquarium.id);
    // Keep URL in sync so the effect doesn't revert the selection
    const newParams = new URLSearchParams(searchParams);
    newParams.set('aquariumId', aquarium.id);
    setSearchParams(newParams, { replace: true });
  };

  const handleParameterClick = (paramName: string) => {
    setSelectedParameter(paramName);
    // Scroll to trends section when parameter clicked
    document.getElementById('trends-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTestClick = (_testId: string) => {
    // Scroll to trends section when test clicked
    document.getElementById('trends-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogFirstTest = () => {
    document.getElementById('quick-log-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading || aquariumsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (aquariumsError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Unable to load water tests</h2>
            <p className="text-muted-foreground">Please retry and make sure your connection is stable.</p>
            <Button onClick={() => refetchAquariums()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!aquariums || aquariums.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t('waterTests.noAquariums')}</h2>
            <p className="text-muted-foreground">
              {t('waterTests.createAquariumFirst')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe space-y-6">
        {/* Hero Section */}
        <SectionErrorBoundary fallbackTitle="Failed to load health overview" featureArea={FeatureArea.WATER_TESTS}>
          <WaterQualityHero
            aquariums={aquariums}
            selectedAquarium={selectedAquarium || null}
            onAquariumChange={handleAquariumChange}
            healthScore={healthData.score}
            healthLabel={healthData.label}
            healthColor={healthData.color}
            lastTestDate={healthData.lastWaterTest}
            alerts={parameterAlerts}
            onAlertParameterClick={handleParameterClick}
            onLogFirstTest={handleLogFirstTest}
          />
        </SectionErrorBoundary>

        {/* Quick Log CTA */}
        <div id="quick-log-section">
          <SectionErrorBoundary fallbackTitle="Failed to load quick log" featureArea={FeatureArea.WATER_TESTS}>
            <QuickLogSection aquarium={selectedAquarium ? { id: selectedAquarium.id, name: selectedAquarium.name, type: selectedAquarium.type } : null} />
          </SectionErrorBoundary>
        </div>

        {/* Parameter Insights Grid */}
        <SectionErrorBoundary fallbackTitle="Failed to load parameters" featureArea={FeatureArea.WATER_TESTS}>
          <ParameterInsightsGrid
            tests={testsData || []}
            units={units}
            onParameterClick={handleParameterClick}
          />
        </SectionErrorBoundary>

        {/* Recent Activity Timeline */}
        <SectionErrorBoundary fallbackTitle="Failed to load activity" featureArea={FeatureArea.WATER_TESTS}>
          <RecentActivityTimeline
            tests={testsData || []}
            units={units}
            onTestClick={handleTestClick}
            maxItems={10}
          />
        </SectionErrorBoundary>

        {/* Trends Section */}
        <div id="trends-section" className="pb-[calc(13rem+env(safe-area-inset-bottom))] md:pb-24">
          <h2 className="text-lg font-semibold mb-4">{t('waterTests.trends')}</h2>
          <SectionErrorBoundary fallbackTitle="Failed to load charts" featureArea={FeatureArea.WATER_TESTS}>
            <Suspense fallback={<WaterTestChartsSkeleton />}>
              {selectedAquarium && (
                <WaterTestCharts
                  aquarium={selectedAquarium}
                  selectedParameter={selectedParameter}
                  onSelectedParameterChange={setSelectedParameter}
                />
              )}
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default WaterTests;
