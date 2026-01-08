import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getDistanceKm } from '@/lib/geoUtils';

const LOCATION_CHANGE_THRESHOLD_KM = 10; // Auto-update if moved more than 10km

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
  // Location coordinates
  latitude: number;
  longitude: number;
  
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

const CACHE_KEY_PREFIX = 'ally_weather_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(userId: string | undefined): string {
  // Use a unique cache key per user, with a hash for anonymous users based on session
  if (userId) {
    return `${CACHE_KEY_PREFIX}${userId}`;
  }
  // For anonymous users, try to use a session-based key to avoid cache collision
  const sessionKey = sessionStorage.getItem('ally_anon_session_key');
  if (sessionKey) {
    return `${CACHE_KEY_PREFIX}anon_${sessionKey}`;
  }
  // Generate a new session key for anonymous users
  const newSessionKey = Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('ally_anon_session_key', newSessionKey);
  return `${CACHE_KEY_PREFIX}anon_${newSessionKey}`;
}

function isValidWeatherData(data: unknown): data is WeatherData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.temperature === 'number' &&
    typeof d.condition === 'string' &&
    typeof d.fetchedAt === 'string'
  );
}

function getCachedWeather(userId: string | undefined): WeatherData | null {
  try {
    const cacheKey = getCacheKey(userId);
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    
    // Validate the parsed data has required structure
    if (!isValidWeatherData(data)) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    const fetchedAt = new Date(data.fetchedAt).getTime();
    const now = Date.now();
    
    if (now - fetchedAt > CACHE_TTL) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch {
    sessionStorage.removeItem(getCacheKey(userId));
    return null;
  }
}

function setCachedWeather(weather: WeatherData, userId: string | undefined): void {
  try {
    sessionStorage.setItem(getCacheKey(userId), JSON.stringify(weather));
  } catch {
    // Ignore storage errors
  }
}

export function useWeather() {
  const { user } = useAuth();
  const [state, setState] = useState<WeatherState>(() => ({
    weather: getCachedWeather(user?.id),
    loading: true,
    error: null,
    enabled: false,
    initializing: true,
  }));

  const fetchWeather = useCallback(async (latitude: number, longitude: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { latitude, longitude },
      });

      if (error) throw error;

      // Add coordinates to weather data for components that need them
      const weatherData: WeatherData = {
        ...data,
        latitude,
        longitude,
      };
      setCachedWeather(weatherData, user?.id);
      
      setState(prev => ({
        ...prev,
        weather: weatherData,
        loading: false,
      }));

      return weatherData;
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch weather',
      }));
      return null;
    }
  }, []);

  // Request fresh GPS location and save to profile
  const fetchWeatherForCurrentLocation = useCallback(async (forceRefresh = false) => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Save the new coordinates to profile for future sessions (no more GPS prompts)
        if (user?.id) {
          await supabase
            .from('profiles')
            .update({ latitude, longitude })
            .eq('user_id', user.id);
        }
        
        await fetchWeather(latitude, longitude);
      },
      async () => {
        // Fallback to saved profile location
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('user_id', user.id)
            .maybeSingle();

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

  // Silently check if user moved significantly and update location if needed
  const checkAndUpdateLocation = useCallback(async (
    savedLat: number,
    savedLon: number
  ): Promise<{ lat: number; lon: number }> => {
    if (!navigator.geolocation) {
      return { lat: savedLat, lon: savedLon };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const distance = getDistanceKm(savedLat, savedLon, latitude, longitude);

          // If moved significantly, update profile silently
          if (distance > LOCATION_CHANGE_THRESHOLD_KM) {
            if (user?.id) {
              await supabase
                .from('profiles')
                .update({ latitude, longitude })
                .eq('user_id', user.id);
            }
            resolve({ lat: latitude, lon: longitude });
          } else {
            resolve({ lat: savedLat, lon: savedLon });
          }
        },
        () => {
          // GPS failed silently, use saved location
          resolve({ lat: savedLat, lon: savedLon });
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        }
      );
    });
  }, [user?.id]);

  // Load weather on mount if user has weather enabled - prioritize saved location
  useEffect(() => {
    if (!user?.id) {
      setState(prev => ({ ...prev, initializing: false, loading: false }));
      return;
    }

    const loadWeather = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weather_enabled, latitude, longitude')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.weather_enabled) {
          setState(prev => ({ ...prev, enabled: true }));
          
          // Use cached weather if still valid
          const cached = getCachedWeather(user?.id);
          if (cached) {
            setState(prev => ({ ...prev, weather: cached, loading: false, initializing: false }));
            return;
          }

          // Use saved profile coordinates if available (NO GPS PROMPT!)
          if (profile.latitude && profile.longitude) {
            // Silently check if location changed significantly
            const { lat, lon } = await checkAndUpdateLocation(profile.latitude, profile.longitude);
            await fetchWeather(lat, lon);
          } else {
            // Only request GPS if no saved location exists
            await fetchWeatherForCurrentLocation();
          }
        }
      } finally {
        setState(prev => ({ ...prev, initializing: false, loading: false }));
      }
    };

    loadWeather();
  }, [user?.id, fetchWeather, fetchWeatherForCurrentLocation, checkAndUpdateLocation]);

  const refreshWeather = useCallback(async () => {
    sessionStorage.removeItem(getCacheKey(user?.id));
    await fetchWeatherForCurrentLocation(true);
  }, [user?.id, fetchWeatherForCurrentLocation]);

  return {
    ...state,
    refreshWeather,
    fetchWeather,
  };
}
