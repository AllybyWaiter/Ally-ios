-- Geocode cache for weather reverse-geocode lookups.
-- Buckets use 2-decimal lat/lon precision to reduce provider calls and throttling.

CREATE TABLE IF NOT EXISTS public.weather_geocode_cache (
  lat_bucket INTEGER NOT NULL,
  lon_bucket INTEGER NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  location_name TEXT NOT NULL,
  country_code TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (lat_bucket, lon_bucket, locale),
  CONSTRAINT weather_geocode_cache_lat_range CHECK (lat_bucket BETWEEN -9000 AND 9000),
  CONSTRAINT weather_geocode_cache_lon_range CHECK (lon_bucket BETWEEN -18000 AND 18000)
);

CREATE INDEX IF NOT EXISTS weather_geocode_cache_expires_at_idx
  ON public.weather_geocode_cache (expires_at);

COMMENT ON TABLE public.weather_geocode_cache IS 'TTL cache for reverse geocoding used by get-weather edge function.';

