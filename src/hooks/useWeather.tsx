import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';

export interface ForecastDay {
  date: string;
  condition: WeatherCondition;
  tempMax: number;
  tempMin: number;
  windSpeed: number;
  uvIndexMax: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: WeatherCondition;
  isDay: boolean;
}

export interface WeatherData {
  condition: WeatherCondition;
  weatherCode: number;
  temperature: number;
  feelsLike: number;
  temperatureUnit: string;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
  isDay: boolean;
  fetchedAt: string;
  sunrise: string | null;
  sunset: string | null;
  locationName: string | null;
  hourlyForecast: HourlyForecast[];
  forecast: ForecastDay[];
}

interface WeatherState {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  enabled: boolean;
  initializing: boolean;
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
    loading: true,
    error: null,
    enabled: false,
    initializing: true,
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
    if (!user?.id) {
      setState(prev => ({ ...prev, initializing: false, loading: false }));
      return;
    }

    const loadWeatherFromProfile = async () => {
      try {
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
            setState(prev => ({ ...prev, weather: cached, loading: false, initializing: false }));
            return;
          }

          // Fetch fresh weather
          await fetchWeather(profile.latitude, profile.longitude);
        }
      } finally {
        setState(prev => ({ ...prev, initializing: false, loading: false }));
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
