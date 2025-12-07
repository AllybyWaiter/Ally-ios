import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WaterTestForm } from "@/components/water-tests/WaterTestForm";
import { WaterTestHistory } from "@/components/water-tests/WaterTestHistory";
import { WaterTestCharts } from "@/components/water-tests/WaterTestCharts";
import { Loader2 } from "lucide-react";

const WaterTests = () => {
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null);
  const { t } = useTranslation();

  const { data: aquariums, isLoading } = useQuery({
    queryKey: ["aquariums"],
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

  // Auto-select first aquarium if none selected
  if (!selectedAquariumId && aquariums && aquariums.length > 0) {
    setSelectedAquariumId(aquariums[0].id);
  }

  const selectedAquarium = aquariums?.find((a) => a.id === selectedAquariumId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!aquariums || aquariums.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 pt-24 mt-safe">
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
      <div className="container mx-auto px-4 py-8 pt-24 mt-safe">
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
            {selectedAquarium && (
              <WaterTestForm aquarium={selectedAquarium} />
            )}
          </TabsContent>

          <TabsContent value="history">
            {selectedAquarium && (
              <WaterTestHistory aquariumId={selectedAquarium.id} />
            )}
          </TabsContent>

          <TabsContent value="charts">
            {selectedAquarium && (
              <WaterTestCharts aquarium={selectedAquarium} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WaterTests;
