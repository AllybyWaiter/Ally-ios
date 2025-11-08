import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AquariumOverview } from "@/components/aquarium/AquariumOverview";
import { WaterTestCharts } from "@/components/water-tests/WaterTestCharts";
import { AquariumEquipment } from "@/components/aquarium/AquariumEquipment";
import { AquariumTasks } from "@/components/aquarium/AquariumTasks";
import { format } from "date-fns";

export default function AquariumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: aquarium, isLoading } = useQuery({
    queryKey: ["aquarium", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aquariums")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!aquarium) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Aquarium not found</h1>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{aquarium.name}</h1>
            <Badge variant="secondary">{aquarium.type}</Badge>
            <Badge variant="outline">{aquarium.status}</Badge>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {aquarium.volume_gallons && (
              <span>{aquarium.volume_gallons} gallons</span>
            )}
            {aquarium.setup_date && (
              <span>Setup: {format(new Date(aquarium.setup_date), "PPP")}</span>
            )}
          </div>
          {aquarium.notes && (
            <p className="mt-3 text-muted-foreground">{aquarium.notes}</p>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="water-tests">Water Tests</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AquariumOverview aquariumId={id!} aquarium={aquarium} />
          </TabsContent>

          <TabsContent value="water-tests">
            <WaterTestCharts aquarium={{ id: id!, name: aquarium.name, type: aquarium.type }} />
          </TabsContent>

          <TabsContent value="equipment">
            <AquariumEquipment aquariumId={id!} />
          </TabsContent>

          <TabsContent value="tasks">
            <AquariumTasks aquariumId={id!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
