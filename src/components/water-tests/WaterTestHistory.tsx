import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { fetchWaterTests } from "@/infrastructure/queries";
import { VirtualizedTestHistory } from "./VirtualizedTestHistory";

interface WaterTestHistoryProps {
  aquariumId: string;
}

export const WaterTestHistory = ({ aquariumId }: WaterTestHistoryProps) => {
  const { units } = useAuth();
  const { t } = useTranslation();
  
  const { data: tests, isLoading } = useQuery({
    queryKey: queryKeys.waterTests.list(aquariumId),
    queryFn: () => fetchWaterTests(aquariumId, 50), // Increased limit since virtualized
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
            {t('waterTests.noTestsYet')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Use virtualized list for better performance with many tests
  return <VirtualizedTestHistory tests={tests} units={units} />;
};
