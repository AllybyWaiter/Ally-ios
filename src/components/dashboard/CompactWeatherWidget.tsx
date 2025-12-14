import { Link } from 'react-router-dom';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { formatTemperature } from '@/lib/unitConversions';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';
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
  const { weather, loading, enabled, initializing } = useWeather();
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

  const WeatherIcon = weatherIcons[weather.condition] || Sun;
  const temperature = formatTemperature(weather.temperature, units, 'C');
  const feelsLike = formatTemperature(weather.feelsLike, units, 'C');

  return (
    <Link 
      to="/weather" 
      className="glass-card rounded-xl px-4 py-3 mb-4 flex items-center justify-between group hover:bg-background/50 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <WeatherIcon className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">{temperature}</span>
        <span className="text-muted-foreground text-sm capitalize">{weather.condition}</span>
        <span className="text-muted-foreground/70 text-xs hidden sm:inline">
          · Feels {feelsLike}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}
