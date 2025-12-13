import { useState, useEffect } from 'react';
import { MapPin, Cloud, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function WeatherSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { requestLocation, clearLocation, loading: geoLoading, permissionState } = useGeolocation();
  const { weather, enabled, refreshWeather, loading: weatherLoading } = useWeather();
  
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Load current settings
  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude, weather_enabled')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setWeatherEnabled(profile.weather_enabled || false);
        setHasLocation(!!profile.latitude && !!profile.longitude);
      }
      setLocationLoading(false);
    };

    loadSettings();
  }, [user?.id]);

  const handleToggleWeather = async (enabled: boolean) => {
    if (!user?.id) return;

    // If enabling without location, request location first
    if (enabled && !hasLocation) {
      const success = await requestLocation();
      if (success) {
        setHasLocation(true);
        setWeatherEnabled(true);
      }
      return;
    }

    setWeatherEnabled(enabled);
    
    await supabase
      .from('profiles')
      .update({ weather_enabled: enabled })
      .eq('user_id', user.id);

    toast({
      title: enabled ? "Weather Enabled" : "Weather Disabled",
      description: enabled 
        ? "Your dashboard will now show weather-aware content."
        : "Weather features have been turned off.",
    });
  };

  const handleDetectLocation = async () => {
    const success = await requestLocation();
    if (success) {
      setHasLocation(true);
      setWeatherEnabled(true);
    }
  };

  const handleClearLocation = async () => {
    await clearLocation();
    setHasLocation(false);
    setWeatherEnabled(false);
    toast({
      title: "Location Cleared",
      description: "Your location data has been removed.",
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

  if (locationLoading) {
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
          Enable weather-aware visuals on your dashboard based on your local weather conditions.
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
            disabled={geoLoading}
          />
        </div>

        {/* Location Status */}
        <div className="space-y-3">
          <Label>Location</Label>
          
          {hasLocation ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md flex-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Location detected</span>
                {weather && (
                  <span className="ml-auto text-foreground">
                    {getConditionLabel(weather.condition)}, {weather.temperature}°C
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={refreshWeather}
                disabled={weatherLoading}
              >
                <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearLocation}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleDetectLocation}
                disabled={geoLoading}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {geoLoading ? 'Detecting...' : 'Detect My Location'}
              </Button>
              
              {permissionState === 'denied' && (
                <p className="text-sm text-destructive">
                  Location permission was denied. Please enable it in your browser settings.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-muted-foreground">
          Your location is only used to fetch local weather data and is stored securely in your profile. 
          We never share your location with third parties.
        </p>
      </CardContent>
    </Card>
  );
}
