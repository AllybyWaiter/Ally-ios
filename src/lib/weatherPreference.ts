import { supabase } from '@/integrations/supabase/client';

const LOCATION_DECLINED_KEY_PREFIX = 'weather_location_declined_';
const DEFAULT_TIMEOUT_MS = 12000;

export type WeatherLocationCaptureSource = 'gps' | 'saved_profile' | 'manual' | 'unknown';

export interface WeatherPreferenceResult {
  enabled: boolean;
  capturedLocation: boolean;
  locationDeclined: boolean;
  locationSource: WeatherLocationCaptureSource;
  message: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number | null;
}

function getDeclinedLocationKey(userId: string): string {
  return `${LOCATION_DECLINED_KEY_PREFIX}${userId}`;
}

function setDeclinedLocation(userId: string, declined: boolean): void {
  try {
    if (declined) {
      localStorage.setItem(getDeclinedLocationKey(userId), '1');
      return;
    }
    localStorage.removeItem(getDeclinedLocationKey(userId));
  } catch {
    // Storage errors should never block preference updates.
  }
}

function geolocationErrorToMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied';
    case error.POSITION_UNAVAILABLE:
      return 'Location unavailable';
    case error.TIMEOUT:
      return 'Location request timed out';
    default:
      return 'Unable to access location';
  }
}

function isGeolocationError(error: unknown): error is GeolocationPositionError {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: unknown };
  return typeof maybe.code === 'number';
}

function requestBrowserLocation(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 60 * 1000,
      }
    );
  });
}

async function persistWeatherPreference(
  userId: string,
  payload: {
    weather_enabled: boolean;
    latitude?: number;
    longitude?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

export async function loadWeatherEnabled(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('weather_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(data?.weather_enabled);
}

export async function setWeatherPreference(params: {
  userId: string;
  enabled: boolean;
}): Promise<WeatherPreferenceResult> {
  const { userId, enabled } = params;

  if (!enabled) {
    await persistWeatherPreference(userId, { weather_enabled: false });
    setDeclinedLocation(userId, false);
    return {
      enabled: false,
      capturedLocation: false,
      locationDeclined: false,
      locationSource: 'unknown',
      message: 'Weather disabled.',
    };
  }

  if (!navigator.geolocation) {
    await persistWeatherPreference(userId, { weather_enabled: true });
    setDeclinedLocation(userId, true);
    return {
      enabled: true,
      capturedLocation: false,
      locationDeclined: true,
      locationSource: 'saved_profile',
      message: 'Weather enabled without live location (geolocation unsupported).',
    };
  }

  try {
    const position = await requestBrowserLocation();
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracyMeters = Number.isFinite(position.coords.accuracy)
      ? Math.round(position.coords.accuracy)
      : null;

    await persistWeatherPreference(userId, {
      weather_enabled: true,
      latitude,
      longitude,
    });

    setDeclinedLocation(userId, false);
    return {
      enabled: true,
      capturedLocation: true,
      locationDeclined: false,
      locationSource: 'gps',
      latitude,
      longitude,
      accuracyMeters,
      message: 'Weather enabled with current location.',
    };
  } catch (error) {
    await persistWeatherPreference(userId, { weather_enabled: true });
    setDeclinedLocation(userId, true);

    const message = isGeolocationError(error)
      ? geolocationErrorToMessage(error)
      : error instanceof Error
        ? error.message
        : 'Unable to access location';

    return {
      enabled: true,
      capturedLocation: false,
      locationDeclined: true,
      locationSource: 'saved_profile',
      message: `Weather enabled; using fallback location (${message}).`,
    };
  }
}
