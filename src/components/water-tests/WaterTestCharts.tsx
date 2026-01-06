import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceArea } from "recharts";
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
import { getParameterTemplates } from "@/lib/waterTestUtils";
import { isPoolType } from "@/lib/waterBodyUtils";

// Color mapping for different parameter types
const getParameterColor = (paramName: string, aquariumType: string): string => {
  const isPool = isPoolType(aquariumType);
  
  if (isPool) {
    const poolColors: Record<string, string> = {
      'Free Chlorine': '#22c55e',
      'Total Chlorine': '#16a34a',
      'pH': '#3b82f6',
      'Alkalinity': '#8b5cf6',
      'Calcium Hardness': '#f97316',
      'Cyanuric Acid': '#eab308',
      'Temperature': '#ef4444',
      'Salt': '#06b6d4',
    };
    return poolColors[paramName] || '#6b7280';
  }
  
  const aquariumColors: Record<string, string> = {
    'pH': '#3b82f6',
    'Ammonia': '#ef4444',
    'Nitrite': '#f97316',
    'Nitrate': '#eab308',
    'Temperature': '#ef4444',
    'Salinity': '#06b6d4',
    'Alkalinity': '#8b5cf6',
    'Calcium': '#22c55e',
    'Magnesium': '#14b8a6',
    'Phosphate': '#f472b6',
    'KH': '#a855f7',
    'GH': '#6366f1',
  };
  return aquariumColors[paramName] || 'hsl(var(--primary))';
};

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
      interface TestData {
        test_date: string;
        test_parameters?: Array<{
          parameter_name: string;
          value: number;
          unit: string;
        }>;
      }
      
      interface ChartDataPoint {
        date: string;
        fullDate: string;
        [key: string]: string | number;
      }
      
      const formattedData = data.map((test: TestData) => {
        const dataPoint: ChartDataPoint = {
          date: format(new Date(test.test_date), "MMM dd"),
          fullDate: test.test_date,
        };

        test.test_parameters?.forEach((param) => {
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

  // Memoize parameter range for reference lines
  const parameterRange = useMemo(() => {
    const templates = getParameterTemplates(aquarium.type);
    for (const template of templates) {
      const param = template.parameters.find(p => p.name === selectedParameter);
      if (param?.range) return param.range;
    }
    return null;
  }, [aquarium.type, selectedParameter]);

  // Get dynamic color for the selected parameter
  const lineColor = useMemo(() => 
    getParameterColor(selectedParameter, aquarium.type), 
    [selectedParameter, aquarium.type]
  );

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
              {/* Ideal range (green shaded area) */}
              {parameterRange && (
                <ReferenceArea 
                  y1={parameterRange.target?.min ?? parameterRange.min} 
                  y2={parameterRange.target?.max ?? parameterRange.max} 
                  fill="#22c55e" 
                  fillOpacity={0.1}
                />
              )}
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
              {/* Warning threshold line */}
              {parameterRange?.flagAbove && (
                <ReferenceLine 
                  y={parameterRange.flagAbove} 
                  stroke="#eab308" 
                  strokeDasharray="5 5"
                />
              )}
              {/* Max boundary line */}
              {parameterRange && (
                <ReferenceLine 
                  y={parameterRange.max} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                />
              )}
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
                stroke={lineColor}
                strokeWidth={2}
                dot={{ fill: lineColor }}
                name={`${selectedParameter} (${parameterUnit})`}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Range Legend */}
          {parameterRange && (
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground justify-center flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 bg-green-500/20 border border-green-500/50 rounded-sm"></div>
                <span>Ideal Range</span>
              </div>
              {parameterRange.flagAbove && (
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-yellow-500" style={{ borderStyle: 'dashed' }}></div>
                  <span>Warning</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-red-500"></div>
                <span>Max Limit</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
