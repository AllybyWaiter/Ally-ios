import { useState, Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WaterTestForm } from "@/components/water-tests/WaterTestForm";
import { WaterTestHistory } from "@/components/water-tests/WaterTestHistory";
import { WaterTestCharts } from "@/components/water-tests/WaterTestCharts";
import { queryKeys } from "@/lib/queryKeys";
import { SectionErrorBoundary } from "@/components/error-boundaries";
import { FeatureArea } from "@/lib/sentry";
import { 
  WaterTestFormSkeleton, 
  WaterTestHistorySkeleton, 
  WaterTestChartsSkeleton 
} from "@/components/water-tests/WaterTestSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

const WaterTests = () => {
  const [searchParams] = useSearchParams();
  const urlAquariumId = searchParams.get('aquariumId');
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(urlAquariumId);
  const { t } = useTranslation();

  const { data: aquariums, isLoading } = useQuery({
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
      // Check if URL param exists and is valid
      if (urlAquariumId && aquariums.some(a => a.id === urlAquariumId)) {
        setSelectedAquariumId(urlAquariumId);
      } else if (!selectedAquariumId) {
        // Fallback to first aquarium
        setSelectedAquariumId(aquariums[0].id);
      }
    }
  }, [aquariums, urlAquariumId]);

  const selectedAquarium = aquariums?.find((a) => a.id === selectedAquariumId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe">
          <div className="mb-6">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="mb-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-10 w-full md:w-96 mb-6" />
          <WaterTestFormSkeleton />
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
      <div className="container mx-auto px-4 py-8 pt-24 pb-20 md:pb-8 mt-safe">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t('waterTests.title')}</h1>
          <p className="text-muted-foreground">
            {t('waterTests.subtitle')}
          </p>
        </div>

        {/* Aquarium Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">{t('waterTests.selectAquarium')}</label>
          <select
            value={selectedAquariumId || ""}
            onChange={(e) => setSelectedAquariumId(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-card border border-border rounded-lg"
          >
            {aquariums.map((aquarium) => (
              <option key={aquarium.id} value={aquarium.id}>
                {aquarium.name} ({aquarium.type})
              </option>
            ))}
          </select>
        </div>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="log">{t('waterTests.logTest')}</TabsTrigger>
            <TabsTrigger value="history">{t('waterTests.history')}</TabsTrigger>
            <TabsTrigger value="charts">{t('waterTests.charts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <SectionErrorBoundary fallbackTitle="Failed to load test form" featureArea={FeatureArea.WATER_TESTS}>
              <Suspense fallback={<WaterTestFormSkeleton />}>
                {selectedAquarium && (
                  <WaterTestForm aquarium={selectedAquarium} />
                )}
              </Suspense>
            </SectionErrorBoundary>
          </TabsContent>

          <TabsContent value="history">
            <SectionErrorBoundary fallbackTitle="Failed to load test history" featureArea={FeatureArea.WATER_TESTS}>
              <Suspense fallback={<WaterTestHistorySkeleton />}>
                {selectedAquarium && (
                  <WaterTestHistory aquariumId={selectedAquarium.id} />
                )}
              </Suspense>
            </SectionErrorBoundary>
          </TabsContent>

          <TabsContent value="charts">
            <SectionErrorBoundary fallbackTitle="Failed to load charts" featureArea={FeatureArea.WATER_TESTS}>
              <Suspense fallback={<WaterTestChartsSkeleton />}>
                {selectedAquarium && (
                  <WaterTestCharts aquarium={selectedAquarium} />
                )}
              </Suspense>
            </SectionErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WaterTests;
