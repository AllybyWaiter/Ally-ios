import { useState, Suspense, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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
import type { UnitSystem } from "@/lib/unitConversions";

const WaterTests = () => {
  const [searchParams] = useSearchParams();
  const urlAquariumId = searchParams.get('aquariumId');
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(urlAquariumId);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const { t } = useTranslation();
  const { units } = useProfileContext();

  const { data: aquariums, isLoading: aquariumsLoading } = useQuery({
    queryKey: queryKeys.aquariums.all,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("aquariums")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Auto-select aquarium from URL param or first available
  useEffect(() => {
    if (aquariums && aquariums.length > 0) {
      if (urlAquariumId && aquariums.some(a => a.id === urlAquariumId)) {
        setSelectedAquariumId(urlAquariumId);
      } else if (!selectedAquariumId) {
        setSelectedAquariumId(aquariums[0].id);
      }
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
    return latest.test_parameters?.map(p => ({
      parameter: p.parameter_name,
      status: (p.status as 'good' | 'warning' | 'critical') || 'unknown'
    })) || [];
  }, [testsData]);

  const handleAquariumChange = (aquarium: { id: string }) => {
    setSelectedAquariumId(aquarium.id);
  };

  const handleParameterClick = (paramName: string) => {
    // Open trends section when parameter clicked
    setTrendsOpen(true);
  };

  const handleTestClick = (testId: string) => {
    // Could open detail view in future
    console.log('Clicked test:', testId);
  };

  if (aquariumsLoading) {
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
          />
        </SectionErrorBoundary>

        {/* Quick Log CTA */}
        <SectionErrorBoundary fallbackTitle="Failed to load quick log" featureArea={FeatureArea.WATER_TESTS}>
          <QuickLogSection aquarium={selectedAquarium ? { id: selectedAquarium.id, name: selectedAquarium.name, type: selectedAquarium.type } : null} />
        </SectionErrorBoundary>

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

        {/* Collapsible Trends Section */}
        <Collapsible open={trendsOpen} onOpenChange={setTrendsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-between"
            >
              <span>{t('waterTests.trends')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${trendsOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <SectionErrorBoundary fallbackTitle="Failed to load charts" featureArea={FeatureArea.WATER_TESTS}>
              <Suspense fallback={<WaterTestChartsSkeleton />}>
                {selectedAquarium && (
                  <WaterTestCharts aquarium={selectedAquarium} />
                )}
              </Suspense>
            </SectionErrorBoundary>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default WaterTests;
