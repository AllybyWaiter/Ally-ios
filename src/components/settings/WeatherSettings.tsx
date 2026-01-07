import { useState, useEffect } from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeather } from '@/hooks/useWeather';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function WeatherSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { weather, enabled, refreshWeather, loading: weatherLoading } = useWeather();
  
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Load current settings
  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('weather_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      setWeatherEnabled(profile?.weather_enabled ?? false);
      setSettingsLoading(false);
    };

    loadSettings();
  }, [user?.id]);

  const handleToggleWeather = async (enabled: boolean) => {
    if (!user?.id) return;

    // If enabling, request location permission first
    if (enabled) {
      if (!navigator.geolocation) {
        toast({
          title: "Location Not Supported",
          description: "Your browser doesn't support geolocation.",
          variant: "destructive",
        });
        return;
      }

      // Request location permission
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Permission granted, save coordinates and enable weather
          setWeatherEnabled(true);
          
          await supabase
            .from('profiles')
            .update({ 
              weather_enabled: true,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
            .eq('user_id', user.id);

          toast({
            title: "Weather Enabled",
            description: "Your dashboard will now show weather-aware content based on your current location.",
          });

          // Refresh weather to get current data
          refreshWeather();
        },
        (error) => {
          console.error('Location permission denied:', error);
          toast({
            title: "Location Required",
            description: "Please enable location access to use weather features.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
      return;
    }

    // Disabling weather
    setWeatherEnabled(false);
    
    await supabase
      .from('profiles')
      .update({ weather_enabled: false })
      .eq('user_id', user.id);

    toast({
      title: "Weather Disabled",
      description: "Weather features have been turned off.",
    });
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
          Weather uses your device's current GPS location each time you open the app, so it always shows weather for where you are. Your location is not stored on our servers.
        </p>
      </CardContent>
    </Card>
  );
}
