import { useState, useEffect } from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { loadWeatherEnabled, setWeatherPreference } from '@/lib/weatherPreference';

export function WeatherSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { weather, enabled: _enabled, refreshWeather, loading: weatherLoading } = useWeather();
  
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Load current settings
  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      const enabled = await loadWeatherEnabled(user.id);
      setWeatherEnabled(enabled);
      setSettingsLoading(false);
    };

    loadSettings();
  }, [user?.id]);

  const handleToggleWeather = async (enabled: boolean) => {
    if (!user?.id) return;
    const previousValue = weatherEnabled;
    setWeatherEnabled(enabled);

    try {
      const result = await setWeatherPreference({ userId: user.id, enabled });
      setWeatherEnabled(result.enabled);

      if (result.enabled) {
        toast({
          title: "Weather Enabled",
          description: result.capturedLocation
            ? "Weather now uses your current location."
            : "Weather enabled with fallback location settings.",
        });
        refreshWeather();
      } else {
        toast({
          title: "Weather Disabled",
          description: "Weather features have been turned off.",
        });
      }
    } catch {
      setWeatherEnabled(previousValue);
      toast({
        title: "Failed to update weather setting",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      clear: 'Clear',
      cloudy: 'Cloudy',
      rain: 'Rainy',
      snow: 'Snowy',
      storm: 'Stormy',
      fog: 'Foggy',
    };
    return labels[condition] || condition;
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather Aware Dashboard
        </CardTitle>
        <CardDescription>
          Enable weather-aware visuals on your dashboard. Weather updates automatically based on your current location, just like a native weather app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weather-toggle">Weather aware dashboard</Label>
            <p className="text-sm text-muted-foreground">
              Show weather-themed images and greetings
            </p>
          </div>
          <Switch
            id="weather-toggle"
            checked={weatherEnabled}
            onCheckedChange={handleToggleWeather}
          />
        </div>

        {/* Current Weather Display */}
        {weatherEnabled && weather && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md flex-1">
              <Cloud className="h-4 w-4 text-primary" />
              <span>
                {weather.locationName || 'Current location'}: {getConditionLabel(weather.condition)}, {weather.temperature}°{weather.temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshWeather}
              disabled={weatherLoading}
              aria-label="Refresh weather data"
            >
              <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}

        {/* Privacy Notice */}
        <p className="text-xs text-muted-foreground">
          Weather uses your device's current GPS location when the app opens and when it returns to the foreground. A fallback location may be stored in your profile if GPS is unavailable.
        </p>
      </CardContent>
    </Card>
  );
}
