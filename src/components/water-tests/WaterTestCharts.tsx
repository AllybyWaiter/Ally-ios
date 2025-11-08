import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";

interface WaterTestChartsProps {
  aquarium: {
    id: string;
    name: string;
    type: string;
  };
}

type DateRange = "7d" | "30d" | "90d" | "1y" | "all";

export const WaterTestCharts = ({ aquarium }: WaterTestChartsProps) => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [selectedParameter, setSelectedParameter] = useState<string>("pH");

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["water-test-charts", aquarium.id, dateRange],
    queryFn: async () => {
      let startDate: Date | null = null;
      const now = new Date();

      if (dateRange === "7d") startDate = subDays(now, 7);
      else if (dateRange === "30d") startDate = subDays(now, 30);
      else if (dateRange === "90d") startDate = subDays(now, 90);
      else if (dateRange === "1y") startDate = subDays(now, 365);

      let query = supabase
        .from("water_tests")
        .select(`
          id,
          test_date,
          test_parameters(parameter_name, value, unit)
        `)
        .eq("aquarium_id", aquarium.id)
        .order("test_date", { ascending: true });

      if (startDate) {
        query = query.gte("test_date", startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data for charts
      const formattedData = data.map((test) => {
        const dataPoint: any = {
          date: format(new Date(test.test_date), "MMM dd"),
          fullDate: test.test_date,
        };

        test.test_parameters?.forEach((param: any) => {
          dataPoint[param.parameter_name] = param.value;
        });

        return dataPoint;
      });

      return formattedData;
    },
  });

  // Get unique parameters from data
  const availableParameters =
    chartData && chartData.length > 0
      ? Array.from(
          new Set(
            chartData.flatMap((d) =>
              Object.keys(d).filter((k) => k !== "date" && k !== "fullDate")
            )
          )
        )
      : [];

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
          <CardTitle>{selectedParameter} Over Time</CardTitle>
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedParameter}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
