import { useState, useCallback } from "react";
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

const PAGE_SIZE = 20;

export const WaterTestHistory = ({ aquariumId }: WaterTestHistoryProps) => {
  const { units } = useAuth();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.waterTests.list(aquariumId), page],
    queryFn: () => fetchWaterTests(aquariumId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    ...queryPresets.waterTests,
  });

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

  if (!data?.data || data.data.length === 0) {
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

  return (
    <div className="space-y-4">
      <VirtualizedTestHistory tests={data.data} units={units} />
      {data.hasMore && (
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
              `Load More (${data.total - (page + 1) * PAGE_SIZE} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
