import type { WeatherFreshnessState, WeatherLocationSource } from '@/hooks/useWeather';

export const WEATHER_FRESHNESS_COPY: Record<WeatherFreshnessState, string> = {
  fresh: 'Live weather data',
  stale: 'Data is stale',
  degraded: 'Showing last known weather due to refresh issues',
  offline: 'You are offline. Showing last known weather',
  unavailable: 'Weather is unavailable',
};

export const WEATHER_SOURCE_COPY: Record<WeatherLocationSource, string> = {
  gps: 'GPS',
  saved_profile: 'Saved profile location',
  manual: 'Manual location',
  unknown: 'Unknown source',
};

