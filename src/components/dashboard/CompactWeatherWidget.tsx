import { Link } from 'react-router-dom';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { formatTemperature } from '@/lib/unitConversions';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { WeatherCondition } from '@/hooks/useWeather';

const weatherIcons: Record<WeatherCondition, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};

export function CompactWeatherWidget() {
  const { weather, loading, enabled, initializing, freshnessState } = useWeather();
  const { units } = useAuth();

  // Don't render if weather is not enabled (and we're done initializing)
  if (!initializing && !enabled) {
    return null;
  }

  // Loading state
  if ((initializing || loading) && !weather) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  // Defensive check with logging for unknown conditions
  if (!weather.condition || !weatherIcons[weather.condition]) {
    console.warn(`CompactWeatherWidget: Unknown weather condition "${weather.condition}"`);
  }
  const WeatherIcon = weatherIcons[weather.condition] || Sun;
  const temperature = formatTemperature(weather.temperature, units, 'C');
  const feelsLike = formatTemperature(weather.feelsLike, units, 'C');

  // Prepare sparkline chart data from hourly forecast (next 8 hours)
  const chartData = weather.hourlyForecast?.slice(0, 8).map(hour => ({
    temp: hour.temperature,
  })) || [];

  // Calculate min/max for labels (filter out NaN values)
  const temps = chartData.map(d => d.temp).filter(t => !isNaN(t));
  const minTemp = temps.length > 0 ? Math.min(...temps) : null;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : null;
  const lowLabel = minTemp !== null ? formatTemperature(minTemp, units, 'C') : '';
  const highLabel = maxTemp !== null ? formatTemperature(maxTemp, units, 'C') : '';

  return (
    <Link 
      to="/weather" 
      className="glass-card rounded-xl px-4 py-3 mb-4 flex items-center justify-between group hover:bg-background/50 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <WeatherIcon className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">{temperature}</span>
        <span className="text-muted-foreground text-sm capitalize">{weather.condition}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground hidden md:inline">
          {freshnessState}
        </span>
        <span className="text-muted-foreground/70 text-xs hidden sm:inline">
          · Feels {feelsLike}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {/* Mini hourly temperature sparkline with high/low labels - desktop only */}
        {chartData.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {lowLabel}<span className="text-[10px] ml-0.5 opacity-70">L</span>
            </span>
            <div className="w-20 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="text-xs text-muted-foreground">
              {highLabel}<span className="text-[10px] ml-0.5 opacity-70">H</span>
            </span>
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
}
