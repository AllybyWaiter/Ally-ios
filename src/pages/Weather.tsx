import { Link } from 'react-router-dom';
import { Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Sun, RefreshCw, Wind, Droplets, SunDim, Settings, MapPin, Sunrise, Sunset } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeather, WeatherCondition, ForecastDay } from '@/hooks/useWeather';
import { HourlyForecast } from '@/components/dashboard/HourlyForecast';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatTemperature, formatWindSpeed, getUVLevel } from '@/lib/unitConversions';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import AppHeader from '@/components/AppHeader';

const weatherIcons: Record<WeatherCondition, React.ElementType> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};

const weatherLabels: Record<WeatherCondition, string> = {
  clear: 'Clear Skies',
  cloudy: 'Cloudy',
  rain: 'Rainy',
  snow: 'Snowy',
  storm: 'Stormy',
  fog: 'Foggy',
};

interface ForecastCardProps {
  day: ForecastDay;
  units: 'metric' | 'imperial' | null;
}

function ForecastCard({ day, units }: ForecastCardProps) {
  const WeatherIcon = weatherIcons[day.condition] || Cloud;
  const dayName = format(parseISO(day.date), 'EEEE');
  const dateStr = format(parseISO(day.date), 'MMM d');
  const highTemp = formatTemperature(day.tempMax, units, 'C');
  const lowTemp = formatTemperature(day.tempMin, units, 'C');
  const uvLevel = getUVLevel(day.uvIndexMax);

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <WeatherIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{dayName}</p>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wind className="h-4 w-4" />
              {formatWindSpeed(day.windSpeed, units)}
            </div>
            {day.uvIndexMax != null && day.uvIndexMax > 0 && (
              <div className="flex items-center gap-1">
                <SunDim className="h-4 w-4 text-muted-foreground" />
                <span className={uvLevel.colorClass}>{day.uvIndexMax}</span>
              </div>
            )}
            <div className="text-right min-w-[4rem]">
              <span className="font-semibold">{highTemp}</span>
              <span className="text-muted-foreground"> / {lowTemp}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompactForecastDay({ day, units }: ForecastCardProps) {
  const WeatherIcon = weatherIcons[day.condition] || Cloud;
  const dayName = format(parseISO(day.date), 'EEE');
  const highTemp = formatTemperature(day.tempMax, units, 'C');
  const lowTemp = formatTemperature(day.tempMin, units, 'C');

  return (
    <div className="flex flex-col items-center gap-1 flex-1 py-2">
      <span className="text-xs font-medium text-muted-foreground">{dayName}</span>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <WeatherIcon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col items-center text-xs">
        <span className="font-semibold">{highTemp}</span>
        <span className="text-muted-foreground">{lowTemp}</span>
      </div>
    </div>
  );
}

export default function Weather() {
  const { weather, loading, error, enabled, refreshWeather, initializing } = useWeather();
  const { units, user } = useAuth();
  const isMobile = useIsMobile();

  // Loading state - show during initialization or active loading
  if ((initializing || loading) && !weather) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 pt-28 pb-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Weather not enabled - show friendly message instead of redirecting
  if (!enabled && user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 pt-28 pb-8">
          <div className="max-w-md mx-auto">
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                  <Cloud className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Weather Not Enabled</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Enable weather in your settings to see current conditions and forecasts for your location.
                </p>
                <Button asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Error or no data
  if (error || !weather) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 pt-28 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">Weather Unavailable</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We couldn't fetch weather data. Please try again.
                </p>
                <Button onClick={refreshWeather}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const WeatherIcon = weatherIcons[weather.condition] || Cloud;
  const conditionLabel = weatherLabels[weather.condition] || weather.condition;
  
  const displayTemp = formatTemperature(
    weather.temperature,
    units,
    weather.temperatureUnit === 'celsius' ? 'C' : 'F'
  );

  const feelsLikeTemp = formatTemperature(
    weather.feelsLike,
    units,
    weather.temperatureUnit === 'celsius' ? 'C' : 'F'
  );

  const uvLevel = getUVLevel(weather.uvIndex);

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
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 pt-28 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Weather</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshWeather}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Current Conditions */}
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <WeatherIcon className="h-10 w-10 text-primary" />
                </div>
                <p className="text-5xl font-bold tracking-tight mb-1">
                  {displayTemp}
                </p>
                {weather.feelsLike != null && weather.feelsLike !== weather.temperature && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Feels like {feelsLikeTemp}
                  </p>
                )}
                <p className="text-lg text-muted-foreground">
                  {conditionLabel}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <Wind className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-sm font-medium">
                    {formatWindSpeed(weather.windSpeed, units)}
                  </span>
                  <span className="text-xs text-muted-foreground">Wind</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <Droplets className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-sm font-medium">{weather.humidity}%</span>
                  <span className="text-xs text-muted-foreground">Humidity</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <SunDim className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className={`text-sm font-medium ${uvLevel.colorClass}`}>
                    {weather.uvIndex} {uvLevel.label}
                  </span>
                  <span className="text-xs text-muted-foreground">UV Index</span>
                </div>
              </div>

              {/* Sun Times */}
              {(weather.sunrise || weather.sunset) && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    <Sunrise className="h-5 w-5 text-amber-500 mb-1" />
                    <span className="text-sm font-medium">
                      {weather.sunrise ? format(parseISO(weather.sunrise), 'h:mm a') : '--'}
                    </span>
                    <span className="text-xs text-muted-foreground">Sunrise</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    <Sunset className="h-5 w-5 text-orange-500 mb-1" />
                    <span className="text-sm font-medium">
                      {weather.sunset ? format(parseISO(weather.sunset), 'h:mm a') : '--'}
                    </span>
                    <span className="text-xs text-muted-foreground">Sunset</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    <Sun className="h-5 w-5 text-yellow-500 mb-1" />
                    <span className="text-sm font-medium">
                      {weather.sunrise && weather.sunset ? (() => {
                        const mins = differenceInMinutes(parseISO(weather.sunset), parseISO(weather.sunrise));
                        const hours = Math.floor(mins / 60);
                        const remainingMins = mins % 60;
                        return `${hours}h ${remainingMins}m`;
                      })() : '--'}
                    </span>
                    <span className="text-xs text-muted-foreground">Daylight</span>
                  </div>
                </div>
              )}

              {/* Location and Last Updated */}
              <div className="flex flex-col items-center gap-1 mt-4 text-xs text-muted-foreground">
                {weather.locationName && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium text-foreground">{weather.locationName}</span>
                  </div>
                )}
                <span>Updated {getTimeSinceUpdate()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Forecast */}
          <HourlyForecast />

          {/* 5-Day Forecast */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">5-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "px-4 pb-4" : "space-y-3"}>
              {isMobile ? (
                <div className="flex justify-between">
                  {weather.forecast.map((day) => (
                    <CompactForecastDay key={day.date} day={day} units={units} />
                  ))}
                </div>
              ) : (
                weather.forecast.map((day) => (
                  <ForecastCard key={day.date} day={day} units={units} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
