import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { HourlyForecast } from '@/hooks/useWeather';
import { UnitSystem, celsiusToFahrenheit } from '@/lib/unitConversions';
import { format, parseISO } from 'date-fns';

interface TemperatureChartProps {
  hourlyForecast: HourlyForecast[];
  units: UnitSystem | null;
}

interface ChartDataPoint {
  time: string;
  fullTime: string;
  temperature: number;
  precipProbability: number;
  isDay: boolean;
}

interface TooltipPayloadItem {
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

export function TemperatureChart({ hourlyForecast, units }: TemperatureChartProps) {
  const unitSystem = units || 'imperial';
  
  // Transform data for chart
  const chartData: ChartDataPoint[] = hourlyForecast.map((hour) => {
    const time = parseISO(hour.time);
    const temp = unitSystem === 'imperial' 
      ? celsiusToFahrenheit(hour.temperature) 
      : hour.temperature;
    
    return {
      time: format(time, 'ha'),
      fullTime: format(time, 'h:mm a'),
      temperature: Math.round(temp),
      precipProbability: hour.precipitationProbability,
      isDay: hour.isDay,
    };
  });

  const temps = chartData.map(d => d.temperature);
  const minTemp = Math.min(...temps) - 2;
  const maxTemp = Math.max(...temps) + 2;

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg bg-popover/95 border border-border px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">{data.fullTime}</p>
          <p className="text-lg font-bold">
            {data.temperature}°{unitSystem === 'metric' ? 'C' : 'F'}
          </p>
          {data.precipProbability > 0 && (
            <p className="text-xs text-blue-500">
              {data.precipProbability}% chance of rain
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          24-Hour Temperature Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[minTemp, maxTemp]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${value}°`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Precipitation bars in background */}
              <Bar 
                dataKey="precipProbability" 
                fill="url(#precipGradient)"
                yAxisId={1}
                barSize={8}
                radius={[2, 2, 0, 0]}
              />
              
              {/* Temperature area and line */}
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#tempGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
              
              <YAxis 
                yAxisId={1}
                domain={[0, 100]}
                hide
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded bg-primary" />
            <span>Temperature</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded bg-blue-500/50" />
            <span>Rain Chance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
