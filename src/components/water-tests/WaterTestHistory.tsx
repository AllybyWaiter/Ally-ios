import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { formatParameter, UnitSystem } from "@/lib/unitConversions";
import { formatRelativeTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/queryKeys";
import { fetchWaterTests } from "@/infrastructure/queries";

interface WaterTestHistoryProps {
  aquariumId: string;
}

export const WaterTestHistory = ({ aquariumId }: WaterTestHistoryProps) => {
  const { units } = useAuth();
  const { t } = useTranslation();
  
  const { data: tests, isLoading } = useQuery({
    queryKey: queryKeys.waterTests.list(aquariumId),
    queryFn: () => fetchWaterTests(aquariumId, 20),
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

  return (
    <div className="space-y-4">
      {tests.map((test) => (
        <Card key={test.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {formatRelativeTime(test.test_date)}
              </CardTitle>
              <Badge variant="secondary">{test.confidence}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(test.test_date), "PPP 'at' p")}
            </p>
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
              {test.test_parameters?.map((param: any) => {
                const getStatusBadgeClass = (status: string) => {
                  switch (status) {
                    case 'good':
                      return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
                    case 'warning':
                      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
                    case 'critical':
                      return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
                    default:
                      return 'bg-muted text-muted-foreground border-border';
                  }
                };

                return (
                  <div
                    key={param.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{param.parameter_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatParameter(param.value, param.unit, units)}
                      </p>
                      {param.status && (
                        <Badge className={`text-xs mt-1 border ${getStatusBadgeClass(param.status)}`}>
                          {param.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
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
