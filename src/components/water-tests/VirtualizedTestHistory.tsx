import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatParameter, UnitSystem } from "@/lib/unitConversions";
import { formatRelativeTime } from "@/lib/formatters";

interface TestParameter {
  id: string;
  parameter_name: string;
  value: number;
  unit: string;
  status?: string;
}

interface WaterTest {
  id: string;
  test_date: string;
  confidence: string | null;
  tags: string[] | null;
  notes: string | null;
  test_parameters: TestParameter[];
}

interface VirtualizedTestHistoryProps {
  tests: WaterTest[];
  units: UnitSystem;
}

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

export const VirtualizedTestHistory = ({ tests, units }: VirtualizedTestHistoryProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated card height
    overscan: 3,
  });

  return (
    <div 
      ref={parentRef} 
      className="h-[calc(100vh-300px)] min-h-[400px] max-h-[800px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const test = tests[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card className="mb-4">
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
                    {test.test_parameters?.map((param) => (
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
                    ))}
                  </div>
                  {test.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">{test.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
