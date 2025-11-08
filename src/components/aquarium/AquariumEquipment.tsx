import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Wrench } from "lucide-react";
import { format } from "date-fns";

interface AquariumEquipmentProps {
  aquariumId: string;
}

export const AquariumEquipment = ({ aquariumId }: AquariumEquipmentProps) => {
  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment", aquariumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("aquarium_id", aquariumId)
        .order("install_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!equipment || equipment.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Equipment Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking your aquarium equipment and maintenance schedules
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {equipment.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <Badge variant="secondary">{item.equipment_type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {item.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium">{item.brand}</span>
                  </div>
                )}
                {item.model && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{item.model}</span>
                  </div>
                )}
                {item.install_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Installed:</span>
                    <span className="font-medium">
                      {format(new Date(item.install_date), "PPP")}
                    </span>
                  </div>
                )}
                {item.maintenance_interval_days && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance:</span>
                    <span className="font-medium">
                      Every {item.maintenance_interval_days} days
                    </span>
                  </div>
                )}
                {item.last_maintenance_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Service:</span>
                    <span className="font-medium">
                      {format(new Date(item.last_maintenance_date), "PPP")}
                    </span>
                  </div>
                )}
              </div>
              {item.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{item.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
