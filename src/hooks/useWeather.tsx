import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { FeatureArea, logApiFailure, logDegradedState, logMonitoringEvent, logSlowOperation } from '@/lib/sentry';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';
export type WeatherFreshnessState = 'fresh' | 'stale' | 'degraded' | 'offline' | 'unavailable';
export type WeatherLocationSource = 'gps' | 'saved_profile' | 'manual' | 'unknown';
export type WeatherAlertCoverage = 'full' | 'limited' | 'none';

export interface WeatherMeta {
  provider: string;
  source: string;
  fetchedAt: string;
  dataAgeSeconds: number;
  isStale: boolean;
  locationSource: WeatherLocationSource | string;
  locationAccuracyMeters: number | null;
  alertCoverage: WeatherAlertCoverage | string;
}

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
  windDirection: number;
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
  windDirection: number;
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

  // Reliability metadata (additive, non-breaking)
  meta?: WeatherMeta;
}

interface ReliabilityState {
  freshnessState: WeatherFreshnessState;
  dataAgeSeconds: number | null;
  locationSource: WeatherLocationSource;
  accuracyWarning: string | null;
  alertCoverage: WeatherAlertCoverage;
}

interface WeatherState extends ReliabilityState {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  enabled: boolean;
  initializing: boolean;
}

interface FetchWeatherOptions {
  locationSource?: WeatherLocationSource;
  locationAccuracyMeters?: number | null;
  accuracyWarning?: string | null;
}

const CACHE_KEY_PREFIX = 'ally_weather_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const GEOLOCATION_MAX_AGE_MS = 60 * 1000; // 1 minute
const FOREGROUND_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const FRESHNESS_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
const COARSE_LOCATION_THRESHOLD_METERS = 5000;

type MaybeSingleLikeResult<T> = Promise<{ data: T | null; error: unknown }>;

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const errWithStatus = error as { status?: unknown; context?: { status?: unknown } };
  if (typeof errWithStatus.status === 'number') return errWithStatus.status;
  if (typeof errWithStatus.context?.status === 'number') return errWithStatus.context.status;
  return undefined;
}

function maybeSingleCompat<T>(query: {
  maybeSingle?: () => MaybeSingleLikeResult<T>;
  single?: () => MaybeSingleLikeResult<T>;
}): MaybeSingleLikeResult<T> {
  if (typeof query.maybeSingle === 'function') {
    return query.maybeSingle();
  }
  if (typeof query.single === 'function') {
    return query.single();
  }
  return Promise.resolve({
    data: null,
    error: new Error('Supabase query builder missing maybeSingle/single'),
  });
}

function getCacheKey(userId: string | undefined): string {
  if (userId) {
    return `${CACHE_KEY_PREFIX}${userId}`;
  }

  const sessionKey = sessionStorage.getItem('ally_anon_session_key');
  if (sessionKey) {
    return `${CACHE_KEY_PREFIX}anon_${sessionKey}`;
  }

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
    typeof d.fetchedAt === 'string' &&
    typeof d.windDirection === 'number'
  );
}

function getCachedWeather(userId: string | undefined): WeatherData | null {
  try {
    const cacheKey = getCacheKey(userId);
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;

    const data = JSON.parse(cached);

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

function getOnlineStatus(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') return true;
  return navigator.onLine;
}

function normalizeLocationSource(source?: string | null): WeatherLocationSource {
  if (!source) return 'unknown';
  if (source === 'gps' || source === 'saved_profile' || source === 'manual') return source;
  return 'unknown';
}

function normalizeAlertCoverage(coverage?: string | null): WeatherAlertCoverage {
  if (coverage === 'full' || coverage === 'limited' || coverage === 'none') return coverage;
  return 'none';
}

function computeDataAgeSeconds(weather: WeatherData | null): number | null {
  if (!weather) return null;
  const fromMeta = weather.meta?.dataAgeSeconds;
  if (typeof fromMeta === 'number' && Number.isFinite(fromMeta) && fromMeta >= 0) {
    return Math.round(fromMeta);
  }

  const ts = new Date(weather.fetchedAt).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, Math.round((Date.now() - ts) / 1000));
}

function deriveAccuracyWarning(
  weather: WeatherData | null,
  explicitWarning?: string | null
): string | null {
  if (explicitWarning) return explicitWarning;

  const accuracy = weather?.meta?.locationAccuracyMeters;
  if (typeof accuracy === 'number' && accuracy > COARSE_LOCATION_THRESHOLD_METERS) {
    return 'Location accuracy is currently coarse. Conditions may reflect a nearby area.';
  }

  return null;
}

function deriveReliabilityState(
  weather: WeatherData | null,
  error: string | null,
  isOnline: boolean,
  explicitAccuracyWarning?: string | null
): ReliabilityState {
  const dataAgeSeconds = computeDataAgeSeconds(weather);
  const locationSource = normalizeLocationSource(weather?.meta?.locationSource);
  const alertCoverage = normalizeAlertCoverage(weather?.meta?.alertCoverage);
  const accuracyWarning = deriveAccuracyWarning(weather, explicitAccuracyWarning);

  if (!weather) {
    if (!isOnline) {
      return {
        freshnessState: 'offline',
        dataAgeSeconds,
        locationSource,
        accuracyWarning,
        alertCoverage,
      };
    }

    return {
      freshnessState: 'unavailable',
      dataAgeSeconds,
      locationSource,
      accuracyWarning,
      alertCoverage,
    };
  }

  if (!isOnline) {
    return {
      freshnessState: 'offline',
      dataAgeSeconds,
      locationSource,
      accuracyWarning,
      alertCoverage,
    };
  }

  if (error) {
    return {
      freshnessState: 'degraded',
      dataAgeSeconds,
      locationSource,
      accuracyWarning,
      alertCoverage,
    };
  }

  const isStale = weather.meta?.isStale || ((dataAgeSeconds ?? 0) * 1000 > FRESHNESS_THRESHOLD_MS);

  return {
    freshnessState: isStale ? 'stale' : 'fresh',
    dataAgeSeconds,
    locationSource,
    accuracyWarning,
    alertCoverage,
  };
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was denied';
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable';
    case error.TIMEOUT:
      return 'Location request timed out';
    default:
      return 'Location unavailable';
  }
}

export function useWeather() {
  const { user } = useAuth();

  const [state, setState] = useState<WeatherState>(() => {
    const cached = getCachedWeather(user?.id);
    const reliability = deriveReliabilityState(cached, null, getOnlineStatus());

    return {
      weather: cached,
      loading: true,
      error: null,
      enabled: false,
      initializing: true,
      ...reliability,
    };
  });

  // Abort ref to prevent state updates after unmount in geolocation callbacks
  const geolocationAbortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const fetchWeather = useCallback(async (
    latitude: number,
    longitude: number,
    options: FetchWeatherOptions = {}
  ) => {
    const abortFlag = geolocationAbortRef.current;
    const startedAt = performance.now();
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: {
          latitude,
          longitude,
          ...(options.locationSource ? { locationSource: options.locationSource } : {}),
          ...(typeof options.locationAccuracyMeters === 'number'
            ? { locationAccuracyMeters: options.locationAccuracyMeters }
            : {}),
        },
      });

      if (abortFlag.aborted) return null;
      if (error) throw error;

      const weatherData: WeatherData = {
        ...data,
        latitude,
        longitude,
        meta: {
          provider: data?.meta?.provider || 'open-meteo',
          source: data?.meta?.source || 'live',
          fetchedAt: data?.meta?.fetchedAt || new Date().toISOString(),
          dataAgeSeconds: 0,
          isStale: false,
          locationSource: options.locationSource || data?.meta?.locationSource || 'gps',
          locationAccuracyMeters:
            typeof options.locationAccuracyMeters === 'number'
              ? Math.round(options.locationAccuracyMeters)
              : (typeof data?.meta?.locationAccuracyMeters === 'number'
                  ? Math.round(data.meta.locationAccuracyMeters)
                  : null),
          alertCoverage: data?.meta?.alertCoverage || 'none',
        },
      };

      setCachedWeather(weatherData, user?.id);
      const durationMs = performance.now() - startedAt;
      logSlowOperation(
        'get-weather',
        durationMs,
        1200,
        FeatureArea.WEATHER,
        { source: 'supabase.functions.invoke' }
      );

      const reliability = deriveReliabilityState(weatherData, null, getOnlineStatus(), options.accuracyWarning);

      if (abortFlag.aborted) return null;
      setState(prev => ({
        ...prev,
        weather: weatherData,
        loading: false,
        error: null,
        ...reliability,
      }));

      if (reliability.freshnessState !== 'fresh') {
        logMonitoringEvent(
          `weather_state_${reliability.freshnessState}`,
          'warning',
          FeatureArea.WEATHER,
          { location_source: reliability.locationSource }
        );
        logDegradedState(reliability.freshnessState, FeatureArea.WEATHER, {
          location_source: reliability.locationSource,
        });
      }

      return weatherData;
    } catch (err) {
      if (abortFlag.aborted) return null;

      logger.error('Failed to fetch weather:', err);
      const durationMs = performance.now() - startedAt;
      const statusCode = getStatusCode(err);
      const isOnline = getOnlineStatus();

      logApiFailure(
        {
          endpoint: 'get-weather',
          method: 'POST',
          statusCode,
          durationMs,
          operation: 'weather_refresh',
          reason: err instanceof Error ? err.message : 'unknown_error',
        },
        FeatureArea.WEATHER
      );

      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch weather';

      setState(prev => {
        const fallbackWeather = prev.weather ?? getCachedWeather(user?.id);
        const reliability = deriveReliabilityState(fallbackWeather, errorMsg, isOnline, prev.accuracyWarning);

        return {
          ...prev,
          weather: fallbackWeather,
          loading: false,
          error: errorMsg,
          ...reliability,
        };
      });

      logMonitoringEvent(
        'weather_state_degraded',
        isOnline ? 'warning' : 'error',
        FeatureArea.WEATHER,
        {
          status_code: statusCode ?? 0,
          reason: errorMsg,
          online: isOnline,
        }
      );
      logDegradedState(isOnline ? 'degraded' : 'offline', FeatureArea.WEATHER, {
        status_code: statusCode ?? 0,
      });

      return null;
    }
  }, [user?.id]);

  // Request fresh GPS location and save to profile
  const fetchWeatherForCurrentLocation = useCallback(async (forceRefresh = false) => {
    if (!navigator.geolocation) {
      const reliability = deriveReliabilityState(state.weather, 'Geolocation not supported', getOnlineStatus());
      logMonitoringEvent('weather_geolocation_unsupported', 'warning', FeatureArea.WEATHER);
      setState(prev => ({ ...prev, loading: false, error: 'Geolocation not supported', ...reliability }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    geolocationAbortRef.current = { aborted: false };
    const currentAbortRef = geolocationAbortRef.current;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (currentAbortRef.aborted) return;

        const { latitude, longitude, accuracy } = position.coords;
        const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null;
        const accuracyWarning =
          roundedAccuracy != null && roundedAccuracy > COARSE_LOCATION_THRESHOLD_METERS
            ? 'Location accuracy is currently coarse. Conditions may reflect a nearby area.'
            : null;

        if (user?.id) {
          const { error: locError } = await supabase
            .from('profiles')
            .update({ latitude, longitude })
            .eq('user_id', user.id);

          if (locError) {
            logger.error('Failed to save location:', locError);
            logApiFailure(
              {
                endpoint: 'profiles',
                method: 'UPDATE',
                statusCode: getStatusCode(locError),
                operation: 'save_user_location',
                reason: (locError as { message?: string }).message,
              },
              FeatureArea.WEATHER
            );
          }
        }

        if (currentAbortRef.aborted) return;

        await fetchWeather(latitude, longitude, {
          locationSource: 'gps',
          locationAccuracyMeters: roundedAccuracy,
          accuracyWarning,
        });
      },
      async (geoError) => {
        if (currentAbortRef.aborted) return;

        const geoMessage = getGeolocationErrorMessage(geoError);

        if (user?.id) {
          const profileQuery = supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('user_id', user.id);

          const { data: profile, error: profileError } = await maybeSingleCompat<{
            latitude: number | null;
            longitude: number | null;
          }>(profileQuery as unknown as {
            maybeSingle?: () => MaybeSingleLikeResult<{
              latitude: number | null;
              longitude: number | null;
            }>;
            single?: () => MaybeSingleLikeResult<{
              latitude: number | null;
              longitude: number | null;
            }>;
          });

          if (profileError) {
            logger.error('Failed to load saved location:', profileError);
            logApiFailure(
              {
                endpoint: 'profiles',
                method: 'SELECT',
                statusCode: getStatusCode(profileError),
                operation: 'load_saved_location',
                reason: (profileError as { message?: string }).message,
              },
              FeatureArea.WEATHER
            );
          }

          if (currentAbortRef.aborted) return;

          if (profile?.latitude != null && profile?.longitude != null) {
            await fetchWeather(profile.latitude, profile.longitude, {
              locationSource: 'saved_profile',
              locationAccuracyMeters: null,
              accuracyWarning: `Using saved profile location because live GPS is unavailable (${geoMessage.toLowerCase()}).`,
            });
            return;
          }
        }

        const cached = getCachedWeather(user?.id);
        const reliability = deriveReliabilityState(
          cached,
          geoMessage,
          getOnlineStatus(),
          cached
            ? `Using cached weather because live GPS is unavailable (${geoMessage.toLowerCase()}).`
            : null
        );

        logMonitoringEvent(
          'weather_location_unavailable',
          'warning',
          FeatureArea.WEATHER,
          { geolocation_code: geoError.code, geolocation_message: geoError.message }
        );

        setState(prev => ({
          ...prev,
          weather: cached,
          loading: false,
          error: geoMessage,
          ...reliability,
        }));
      },
      {
        enableHighAccuracy: forceRefresh,
        timeout: 10000,
        maximumAge: forceRefresh ? 0 : GEOLOCATION_MAX_AGE_MS,
      }
    );
  }, [user?.id, state.weather, fetchWeather]);

  useEffect(() => {
    return () => {
      geolocationAbortRef.current.aborted = true;
    };
  }, [user?.id]);

  const fetchWeatherRef = useRef(fetchWeather);
  fetchWeatherRef.current = fetchWeather;
  const fetchWeatherForCurrentLocationRef = useRef(fetchWeatherForCurrentLocation);
  fetchWeatherForCurrentLocationRef.current = fetchWeatherForCurrentLocation;

  useEffect(() => {
    if (!user?.id) {
      const reliability = deriveReliabilityState(null, null, getOnlineStatus());
      setState(prev => ({ ...prev, initializing: false, loading: false, ...reliability }));
      return;
    }

    let isMounted = true;
    const userId = user.id;

    const loadWeather = async () => {
      try {
        const profileQuery = supabase
          .from('profiles')
          .select('weather_enabled, latitude, longitude')
          .eq('user_id', userId);

        const { data: profile } = await maybeSingleCompat<{
          weather_enabled: boolean | null;
          latitude: number | null;
          longitude: number | null;
        }>(profileQuery as unknown as {
          maybeSingle?: () => MaybeSingleLikeResult<{
            weather_enabled: boolean | null;
            latitude: number | null;
            longitude: number | null;
          }>;
          single?: () => MaybeSingleLikeResult<{
            weather_enabled: boolean | null;
            latitude: number | null;
            longitude: number | null;
          }>;
        });

        if (!isMounted) return;

        if (profile?.weather_enabled) {
          setState(prev => ({ ...prev, enabled: true }));

          const cached = getCachedWeather(userId);
          if (cached) {
            const reliability = deriveReliabilityState(cached, null, getOnlineStatus());
            setState(prev => ({
              ...prev,
              weather: cached,
              loading: false,
              error: null,
              initializing: false,
              ...reliability,
            }));
          }

          await fetchWeatherForCurrentLocationRef.current();

          if (!cached && profile.latitude != null && profile.longitude != null) {
            await fetchWeatherRef.current(profile.latitude, profile.longitude, {
              locationSource: 'saved_profile',
              locationAccuracyMeters: null,
            });
          }
        } else {
          const reliability = deriveReliabilityState(null, null, getOnlineStatus());
          setState(prev => ({
            ...prev,
            enabled: false,
            loading: false,
            ...reliability,
          }));
        }
      } catch (err) {
        logger.error('Error loading weather:', err);
      } finally {
        if (isMounted) {
          setState(prev => ({ ...prev, initializing: false, loading: false }));
        }
      }
    };

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !state.enabled) return;

    let lastForegroundRefresh = Date.now();

    const maybeRefreshFromForeground = () => {
      if (document.visibilityState === 'hidden') return;

      const now = Date.now();
      if (now - lastForegroundRefresh < FOREGROUND_REFRESH_INTERVAL_MS) return;

      lastForegroundRefresh = now;
      void fetchWeatherForCurrentLocationRef.current();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        maybeRefreshFromForeground();
      }
    };

    window.addEventListener('focus', maybeRefreshFromForeground);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', maybeRefreshFromForeground);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user?.id, state.enabled]);

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
