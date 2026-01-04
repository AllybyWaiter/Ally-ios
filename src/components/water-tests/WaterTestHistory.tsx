import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { queryPresets } from "@/lib/queryConfig";
import { fetchWaterTests } from "@/infrastructure/queries";
import { VirtualizedTestHistory } from "./VirtualizedTestHistory";

interface WaterTestHistoryProps {
  aquariumId: string;
}

interface WaterTest {
  id: string;
  test_date: string;
  confidence: string | null;
  tags: string[] | null;
  notes: string | null;
  test_parameters: Array<{
    id: string;
    parameter_name: string;
    value: number;
    unit: string;
    status?: string;
  }>;
}

const PAGE_SIZE = 20;

export const WaterTestHistory = ({ aquariumId }: WaterTestHistoryProps) => {
  const { units } = useAuth();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [accumulatedTests, setAccumulatedTests] = useState<WaterTest[]>([]);
  
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.waterTests.list(aquariumId), page],
    queryFn: () => fetchWaterTests(aquariumId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    ...queryPresets.waterTests,
  });

  // Accumulate tests across pages
  useEffect(() => {
    if (data?.data) {
      setAccumulatedTests(prev => {
        if (page === 0) {
          return data.data as WaterTest[];
        }
        // Merge new data, avoiding duplicates
        const existingIds = new Set(prev.map(t => t.id));
        const newTests = (data.data as WaterTest[]).filter(t => !existingIds.has(t.id));
        return [...prev, ...newTests];
      });
    }
  }, [data?.data, page]);

  // Reset accumulated tests when aquariumId changes
  useEffect(() => {
    setPage(0);
    setAccumulatedTests([]);
  }, [aquariumId]);

  const handleLoadMore = useCallback(() => {
    if (data?.hasMore) {
      setPage(p => p + 1);
    }
  }, [data?.hasMore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accumulatedTests.length === 0 && !isLoading) {
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

  const remainingCount = data ? Math.max(0, data.total - accumulatedTests.length) : 0;

  return (
    <div className="space-y-4">
      <VirtualizedTestHistory tests={accumulatedTests} units={units} />
      {data?.hasMore && remainingCount > 0 && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More (${remainingCount} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
