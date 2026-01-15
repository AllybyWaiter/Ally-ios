import { Link } from 'react-router-dom';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { formatTemperature, getCardinalDirection } from '@/lib/unitConversions';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
  Wind, Droplets, ChevronRight, Thermometer, Sunrise, Sunset, MapPin
} from 'lucide-react';
import type { WeatherCondition, ForecastDay } from '@/hooks/useWeather';
import { format, parseISO } from 'date-fns';

const weatherIcons: Record<WeatherCondition, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};

function getUvSeverity(uvIndex: number): { label: string; className: string } {
  if (uvIndex <= 2) return { label: 'Low', className: 'text-green-600 dark:text-green-400 bg-green-500/20' };
  if (uvIndex <= 5) return { label: 'Moderate', className: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/20' };
  if (uvIndex <= 7) return { label: 'High', className: 'text-orange-600 dark:text-orange-400 bg-orange-500/20' };
  if (uvIndex <= 10) return { label: 'Very High', className: 'text-red-600 dark:text-red-400 bg-red-500/20' };
  return { label: 'Extreme', className: 'text-purple-600 dark:text-purple-400 bg-purple-500/20' };
}

function formatWindSpeed(speed: number, units: string): string {
  if (units === 'metric') {
    return `${Math.round(speed)} km/h`;
  }
  // Convert km/h to mph
  return `${Math.round(speed * 0.621371)} mph`;
}

// Safe time parsing with error handling
function formatSunTime(isoString: string | undefined): string {
  if (!isoString) return '--:--';
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return '--:--';
  }
}

export function WeatherStatsCard() {
  const { weather, loading, enabled, initializing } = useWeather();
  const { units } = useAuth();

  // Don't render if weather is not enabled (and we're done initializing)
  if (!initializing && !enabled) {
    return null;
  }

  // Loading state
  if ((initializing || loading) && !weather) {
    return (
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-lg" />
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const WeatherIcon = weatherIcons[weather.condition] || Sun;
  const temperature = formatTemperature(weather.temperature, units, 'C');
  const feelsLike = formatTemperature(weather.feelsLike, units, 'C');
  const uvSeverity = getUvSeverity(weather.uvIndex);

  // Get 3-day forecast preview
  const forecastPreview = weather.forecast?.slice(0, 3) || [];

  return (
    <div className="glass-card rounded-xl p-4 mb-4">
      {/* Header with current conditions */}
      <Link 
        to="/weather" 
        className="flex items-center justify-between mb-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="icon-glow p-2.5 rounded-xl">
            <WeatherIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{temperature}</span>
              <span className="text-muted-foreground capitalize">{weather.condition}</span>
            </div>
            <span className="text-sm text-muted-foreground">Feels like {feelsLike}</span>
            {weather.locationName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                <span>{weather.locationName.split(', ').slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          <span className="hidden sm:inline">View Full Forecast</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </Link>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
        {/* Feels Like */}
        <div className="bg-background/40 rounded-lg p-3 text-center">
          <Thermometer className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
          <div className="text-sm font-medium text-foreground">{feelsLike}</div>
          <div className="text-xs text-muted-foreground">Feels Like</div>
        </div>

        {/* Wind */}
        <div className="bg-background/40 rounded-lg p-3 text-center">
          <Wind 
            className="h-4 w-4 text-muted-foreground mx-auto mb-1" 
            style={{ transform: `rotate(${(weather.windDirection ?? 0) + 180}deg)` }}
          />
          <div className="text-sm font-medium text-foreground">
            {getCardinalDirection(weather.windDirection)} {formatWindSpeed(weather.windSpeed, units)}
          </div>
          <div className="text-xs text-muted-foreground">Wind</div>
        </div>

        {/* Humidity */}
        <div className="bg-background/40 rounded-lg p-3 text-center">
          <Droplets className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
          <div className="text-sm font-medium text-foreground">{weather.humidity}%</div>
          <div className="text-xs text-muted-foreground">Humidity</div>
        </div>

        {/* UV Index */}
        <div className="bg-background/40 rounded-lg p-3 text-center">
          <Sun className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-medium text-foreground">{Math.round(weather.uvIndex)}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${uvSeverity.className}`}>
              {uvSeverity.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">UV Index</div>
        </div>

        {/* Sunrise */}
        <div className="bg-background/40 rounded-lg p-3 text-center">
          <Sunrise className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
          <div className="text-sm font-medium text-foreground">
            {formatSunTime(weather.sunrise)}
          </div>
          <div className="text-xs text-muted-foreground">Sunrise</div>
        </div>

        {/* Sunset */}
        <div className="bg-background/40 rounded-lg p-3 text-center">
          <Sunset className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
          <div className="text-sm font-medium text-foreground">
            {formatSunTime(weather.sunset)}
          </div>
          <div className="text-xs text-muted-foreground">Sunset</div>
        </div>
      </div>

      {/* 3-Day Forecast Preview */}
      {forecastPreview.length > 0 && (
        <div className="bg-background/40 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              3-Day Forecast
            </span>
          </div>
          <div className="flex items-center justify-around mt-2">
            {forecastPreview.map((day: ForecastDay, index: number) => {
              const ForecastIcon = weatherIcons[day.condition] || Sun;
              const highTemp = formatTemperature(day.tempMax, units, 'C');
              const lowTemp = formatTemperature(day.tempMin, units, 'C');
              const dayLabel = index === 0 ? 'Today' : format(parseISO(day.date), 'EEE');
              
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{dayLabel}</span>
                  <ForecastIcon className="h-5 w-5 text-primary" />
                  <div className="text-xs">
                    <span className="font-medium text-foreground">{highTemp}</span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-muted-foreground">{lowTemp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
