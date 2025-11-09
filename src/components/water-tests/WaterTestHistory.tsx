import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { formatParameter, UnitSystem } from "@/lib/unitConversions";

interface WaterTestHistoryProps {
  aquariumId: string;
}

export const WaterTestHistory = ({ aquariumId }: WaterTestHistoryProps) => {
  const { unitPreference } = useAuth();
  
  const { data: tests, isLoading } = useQuery({
    queryKey: ["water-tests", aquariumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_tests")
        .select(`
          *,
          test_parameters(*)
        `)
        .eq("aquarium_id", aquariumId)
        .order("test_date", { ascending: false })
        .limit(20);

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

  if (!tests || tests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No water tests recorded yet. Start logging to see your history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => (
        <Card key={test.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(new Date(test.test_date), "PPP 'at' p")}
              </CardTitle>
              <Badge variant="secondary">{test.confidence}</Badge>
            </div>
            {test.tags && test.tags.length > 0 && (
              <div className="flex gap-2 mt-2">
                {test.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {test.test_parameters?.map((param: any) => (
                <div
                  key={param.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{param.parameter_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatParameter(param.value, param.unit, unitPreference as UnitSystem | null)}
                    </p>
                    {param.status && param.status !== "normal" && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        {param.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {test.notes && (
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">{test.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
