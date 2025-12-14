import { Link } from 'react-router-dom';
import { Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Sun, RefreshCw, Wind, Droplets, SunDim, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeather, WeatherCondition } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { formatTemperature, formatWindSpeed, getUVLevel } from '@/lib/unitConversions';

const weatherIcons: Record<WeatherCondition, React.ElementType> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};

const weatherLabels: Record<WeatherCondition, string> = {
  clear: 'Clear skies',
  cloudy: 'Cloudy',
  rain: 'Rainy',
  snow: 'Snowy',
  storm: 'Stormy',
  fog: 'Foggy',
};

export function WeatherCard() {
  const { weather, loading, error, enabled, refreshWeather } = useWeather();
  const { units } = useAuth();

  // Don't render if weather is not enabled
  if (!enabled) {
    return null;
  }

  // Loading state
  if (loading && !weather) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state or no weather data
  if (error || !weather) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Weather unavailable</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshWeather}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = weatherIcons[weather.condition] || Cloud;
  const conditionLabel = weatherLabels[weather.condition] || weather.condition;
  
  // Format temperature based on user's unit preference
  const displayTemp = formatTemperature(
    weather.temperature,
    units,
    weather.temperatureUnit === 'celsius' ? 'C' : 'F'
  );

  // Format feels-like temperature
  const feelsLikeTemp = formatTemperature(
    weather.feelsLike,
    units,
    weather.temperatureUnit === 'celsius' ? 'C' : 'F'
  );

  // Get UV level info
  const uvLevel = getUVLevel(weather.uvIndex);

  // Calculate time since last fetch
  const getTimeSinceUpdate = () => {
    if (!weather.fetchedAt) return '';
    const fetchedAt = new Date(weather.fetchedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - fetchedAt.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Weather Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <WeatherIcon className="h-6 w-6 text-primary" />
            </div>
            
            {/* Temperature and Condition */}
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tracking-tight">
                  {displayTemp}
                </p>
                {weather.feelsLike != null && weather.feelsLike !== weather.temperature && (
                  <span className="text-xs text-muted-foreground">
                    Feels {feelsLikeTemp}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {conditionLabel}
              </p>
              {/* Wind, Humidity, UV */}
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wind className="h-3 w-3" />
                  {formatWindSpeed(weather.windSpeed, units)}
                </span>
                {weather.humidity != null && (
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    {weather.humidity}%
                  </span>
                )}
                {weather.uvIndex != null && (
                  <span className="flex items-center gap-1">
                    <SunDim className="h-3 w-3" />
                    <span>UV {weather.uvIndex}</span>
                    <span className={uvLevel.colorClass}>({uvLevel.label})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Refresh Button and Last Updated */}
          <div className="flex flex-col items-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshWeather}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <span className="text-xs text-muted-foreground">
              {getTimeSinceUpdate()}
            </span>
            <Link 
              to="/weather" 
              className="flex items-center gap-0.5 text-xs text-primary hover:underline"
            >
              Full forecast
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
