import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';

export interface AirQuality {
  aqi: number;
  pm25: number;
  pm10: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
}

export interface MoonPhase {
  phase: string;
  illumination: number;
  emoji: string;
  dayInCycle: number;
  daysUntilFull: number;
  daysUntilNew: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: WeatherCondition;
  isDay: boolean;
  precipitationProbability: number;
  precipitation: number;
}

export interface ForecastDay {
  date: string;
  condition: WeatherCondition;
  tempMax: number;
  tempMin: number;
  windSpeed: number;
  uvIndexMax: number;
  precipitationProbabilityMax: number;
  precipitationSum: number;
}

export interface WeatherData {
  // Core weather
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
  
  // Forecasts
  hourlyForecast: HourlyForecast[];
  forecast: ForecastDay[];
  
  // Precipitation
  precipitationProbability: number;
  precipitationAmount: number;
  
  // Air Quality
  airQuality: AirQuality | null;
  
  // Atmospheric
  pressure: number;
  pressureTrend: 'rising' | 'falling' | 'steady';
  dewPoint: number;
  cloudCover: number;
  visibility: number;
  
  // Moon
  moonPhase: MoonPhase;
}

interface WeatherState {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  enabled: boolean;
  initializing: boolean;
}

const CACHE_KEY = 'ally_weather_cache';
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

  // Auto-detect GPS and fetch weather like native weather apps
  const fetchWeatherForCurrentLocation = useCallback(async (forceRefresh = false) => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeather(latitude, longitude);
      },
      async (error) => {
        console.warn('GPS failed, falling back to saved location:', error.message);
        // Fallback to saved profile location
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('user_id', user.id)
            .single();

          if (profile?.latitude && profile?.longitude) {
            await fetchWeather(profile.latitude, profile.longitude);
          } else {
            setState(prev => ({ ...prev, loading: false, error: 'Location unavailable' }));
          }
        } else {
          setState(prev => ({ ...prev, loading: false, error: 'Location unavailable' }));
        }
      },
      {
        enableHighAccuracy: forceRefresh,
        timeout: 10000,
        maximumAge: forceRefresh ? 0 : 300000,
      }
    );
  }, [user?.id, fetchWeather]);

  // Load weather on mount if user has weather enabled
  useEffect(() => {
    if (!user?.id) {
      setState(prev => ({ ...prev, initializing: false, loading: false }));
      return;
    }

    const loadWeather = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weather_enabled')
          .eq('user_id', user.id)
          .single();

        if (profile?.weather_enabled) {
          setState(prev => ({ ...prev, enabled: true }));
          
          // Use cached weather if still valid
          const cached = getCachedWeather();
          if (cached) {
            setState(prev => ({ ...prev, weather: cached, loading: false, initializing: false }));
            return;
          }

          // Fetch fresh weather using current GPS
          await fetchWeatherForCurrentLocation();
        }
      } finally {
        setState(prev => ({ ...prev, initializing: false, loading: false }));
      }
    };

    loadWeather();
  }, [user?.id, fetchWeatherForCurrentLocation]);

  const refreshWeather = useCallback(async () => {
    sessionStorage.removeItem(CACHE_KEY);
    await fetchWeatherForCurrentLocation(true);
  }, [fetchWeatherForCurrentLocation]);

  return {
    ...state,
    refreshWeather,
    fetchWeather,
  };
}
