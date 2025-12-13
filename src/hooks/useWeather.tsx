import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';

interface WeatherData {
  condition: WeatherCondition;
  weatherCode: number;
  temperature: number;
  temperatureUnit: string;
  windSpeed: number;
  isDay: boolean;
  fetchedAt: string;
}

interface WeatherState {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  enabled: boolean;
}

const CACHE_KEY = 'aquadex_weather_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCachedWeather(): WeatherData | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const fetchedAt = new Date(data.fetchedAt).getTime();
    const now = Date.now();
    
    if (now - fetchedAt > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

function setCachedWeather(weather: WeatherData): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(weather));
  } catch {
    // Ignore storage errors
  }
}

export function useWeather() {
  const { user } = useAuth();
  const [state, setState] = useState<WeatherState>({
    weather: getCachedWeather(),
    loading: false,
    error: null,
    enabled: false,
  });

  const fetchWeather = useCallback(async (latitude: number, longitude: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { latitude, longitude },
      });

      if (error) throw error;

      const weatherData = data as WeatherData;
      setCachedWeather(weatherData);
      
      setState(prev => ({
        ...prev,
        weather: weatherData,
        loading: false,
      }));

      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch weather',
      }));
      return null;
    }
  }, []);

  // Load weather on mount if user has location saved
  useEffect(() => {
    if (!user?.id) return;

    const loadWeatherFromProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude, weather_enabled')
        .eq('user_id', user.id)
        .single();

      if (profile?.weather_enabled && profile.latitude && profile.longitude) {
        setState(prev => ({ ...prev, enabled: true }));
        
        // Use cached weather if available
        const cached = getCachedWeather();
        if (cached) {
          setState(prev => ({ ...prev, weather: cached }));
          return;
        }

        // Fetch fresh weather
        await fetchWeather(profile.latitude, profile.longitude);
      }
    };

    loadWeatherFromProfile();
  }, [user?.id, fetchWeather]);

  const refreshWeather = useCallback(async () => {
    if (!user?.id) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, weather_enabled')
      .eq('user_id', user.id)
      .single();

    if (profile?.latitude && profile?.longitude) {
      sessionStorage.removeItem(CACHE_KEY);
      await fetchWeather(profile.latitude, profile.longitude);
    }
  }, [user?.id, fetchWeather]);

  return {
    ...state,
    refreshWeather,
    fetchWeather,
  };
}
