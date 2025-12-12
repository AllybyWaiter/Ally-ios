import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from 'react-i18next';
import { formatDecimal } from '@/lib/formatters';
import { 
  fahrenheitToCelsius, 
  getTemperatureUnit,
  formatParameter
} from "@/lib/unitConversions";
import { queryKeys } from "@/lib/queryKeys";
import { fetchWaterTestsForChart } from "@/infrastructure/queries";
import { queryPresets } from "@/lib/queryConfig";

interface WaterTestChartsProps {
  aquarium: {
    id: string;
    name: string;
    type: string;
  };
}

type DateRange = "7d" | "30d" | "90d" | "1y" | "all";

export const WaterTestCharts = ({ aquarium }: WaterTestChartsProps) => {
  const { units } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [selectedParameter, setSelectedParameter] = useState<string>("pH");

  const { data: chartData, isLoading } = useQuery({
    queryKey: queryKeys.waterTests.charts(aquarium.id, dateRange),
    queryFn: async () => {
      const data = await fetchWaterTestsForChart(aquarium.id, dateRange);

      // Transform data for charts with unit conversion
      const formattedData = data.map((test: any) => {
        const dataPoint: any = {
          date: format(new Date(test.test_date), "MMM dd"),
          fullDate: test.test_date,
        };

        test.test_parameters?.forEach((param: any) => {
          let displayValue = param.value;
          
          // Convert temperature to user's preferred unit
          if (param.unit === '°F' && units === 'metric') {
            displayValue = fahrenheitToCelsius(param.value);
          }
          
          dataPoint[param.parameter_name] = displayValue;
          dataPoint[`${param.parameter_name}_unit`] = param.unit;
        });

        return dataPoint;
      });

      return formattedData;
    },
    ...queryPresets.waterTests,
  });

  // Memoize available parameters extraction
  const availableParameters = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    return Array.from(
      new Set(
        chartData.flatMap((d: Record<string, unknown>) =>
          Object.keys(d).filter((k) => k !== "date" && k !== "fullDate" && !k.endsWith("_unit"))
        )
      )
    );
  }, [chartData]);
  
  // Memoize parameter unit computation
  const parameterUnit = useMemo(() => {
    if (!chartData || chartData.length === 0) return '';
    const firstDataPoint = chartData.find((d: Record<string, unknown>) => d[`${selectedParameter}_unit`]);
    const storedUnit = firstDataPoint?.[`${selectedParameter}_unit`] || '';
    
    // Convert unit display based on user preference
    if (storedUnit === '°F') {
      return getTemperatureUnit(units);
    }
    return storedUnit as string;
  }, [chartData, selectedParameter, units]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No water test data available. Log some tests to see charts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Parameter</label>
            <Select value={selectedParameter} onValueChange={setSelectedParameter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableParameters.map((param) => (
                  <SelectItem key={param} value={param}>
                    {param}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedParameter} Over Time
            {parameterUnit && (
              <span className="text-sm text-muted-foreground ml-2">
                ({parameterUnit})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                label={{ 
                  value: parameterUnit, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => {
                  return [`${formatDecimal(value, 2)} ${parameterUnit}`, selectedParameter];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedParameter}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
                name={`${selectedParameter} (${parameterUnit})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
