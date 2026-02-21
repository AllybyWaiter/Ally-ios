import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier, createLogger } from '../_shared/mod.ts';

type AlertCoverage = 'full' | 'limited' | 'none';
type LocationSource = 'gps' | 'saved_profile' | 'manual' | 'unknown';

interface FetchJsonResult<T> {
  data: T;
  provider: string;
  attempts: number;
}

interface GeocodeResult {
  locationName: string | null;
  countryCode: string | null;
  provider: string;
  fromCache: boolean;
}

interface GeocodeCacheRow {
  location_name: string;
  country_code: string | null;
  expires_at: string;
}

const GEOCODE_CACHE_TTL_HOURS = 12;
const WEATHER_TIMEOUT_MS = 7000;
const GEO_TIMEOUT_MS = 5000;
const AIR_QUALITY_TIMEOUT_MS = 5000;

function mapWeatherCode(code: number): string {
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'storm';
  return 'clear';
}

function mapOpenWeatherCode(code: number): string {
  if (code >= 200 && code < 300) return 'storm';
  if (code >= 300 && code < 600) return 'rain';
  if (code >= 600 && code < 700) return 'snow';
  if (code >= 700 && code < 800) return 'fog';
  if (code === 800) return 'clear';
  return 'cloudy';
}

function getMoonPhase(date: Date) {
  const LUNAR_CYCLE = 29.53059;
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();
  const msPerDay = 24 * 60 * 60 * 1000;

  const daysSinceKnown = (date.getTime() - KNOWN_NEW_MOON) / msPerDay;
  const phase = ((daysSinceKnown % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase / LUNAR_CYCLE)) / 2 * 100);

  let phaseName: string;
  let emoji: string;

  if (phase < 1.85) { phaseName = 'New Moon'; emoji = '🌑'; }
  else if (phase < 7.38) { phaseName = 'Waxing Crescent'; emoji = '🌒'; }
  else if (phase < 9.23) { phaseName = 'First Quarter'; emoji = '🌓'; }
  else if (phase < 14.77) { phaseName = 'Waxing Gibbous'; emoji = '🌔'; }
  else if (phase < 16.61) { phaseName = 'Full Moon'; emoji = '🌕'; }
  else if (phase < 22.15) { phaseName = 'Waning Gibbous'; emoji = '🌖'; }
  else if (phase < 24.00) { phaseName = 'Last Quarter'; emoji = '🌗'; }
  else { phaseName = 'Waning Crescent'; emoji = '🌘'; }

  const daysUntilFull = phase < 14.77 ? 14.77 - phase : LUNAR_CYCLE - phase + 14.77;
  const daysUntilNew = phase < 1.85 ? 1.85 - phase : LUNAR_CYCLE - phase + 1.85;

  return {
    phase: phaseName,
    illumination,
    emoji,
    dayInCycle: Math.round(phase),
    daysUntilFull: Math.round(daysUntilFull),
    daysUntilNew: Math.round(daysUntilNew),
  };
}

function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function getPressureTrend(hourlyPressure: number[]): 'rising' | 'falling' | 'steady' {
  if (!hourlyPressure || hourlyPressure.length < 6) return 'steady';
  const recent = hourlyPressure.slice(0, 6);
  const latest = recent[0];
  const oldest = recent[recent.length - 1];
  const diff = latest - oldest;
  if (diff > 2) return 'rising';
  if (diff < -2) return 'falling';
  return 'steady';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry<T>(opts: {
  url: string;
  provider: string;
  timeoutMs: number;
  maxAttempts: number;
  headers?: Record<string, string>;
}): Promise<FetchJsonResult<T>> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const response = await fetch(opts.url, {
        headers: opts.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const shouldRetry = response.status === 408 || response.status === 429 || response.status >= 500;
        const body = await response.text().catch(() => '');

        if (!shouldRetry || attempt >= opts.maxAttempts) {
          throw new Error(`${opts.provider} responded with ${response.status}: ${body.slice(0, 180)}`);
        }

        const delay = Math.min(250 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 150), 1500);
        await sleep(delay);
        continue;
      }

      const data = await response.json() as T;
      return {
        data,
        provider: opts.provider,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= opts.maxAttempts) break;

      const delay = Math.min(250 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 150), 1500);
      await sleep(delay);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw (lastError ?? new Error(`Failed to fetch ${opts.provider}`));
}

function bucketCoordinate(value: number): number {
  // 2 decimal places (~1.1km) for cache bucketing.
  return Math.round(value * 100);
}

function getLocaleFromRequest(req: Request): string {
  const header = req.headers.get('accept-language') || 'en';
  const base = header.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
  return base || 'en';
}

function getAlertCoverage(countryCode: string | null): AlertCoverage {
  if (!countryCode) return 'none';
  if (countryCode.toUpperCase() === 'US') return 'full';
  return 'limited';
}

function normalizeLocationSource(value: unknown): LocationSource {
  if (value === 'gps' || value === 'saved_profile' || value === 'manual') return value;
  return 'unknown';
}

function getAdminClient(): SupabaseClient | null {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !serviceRole) return null;

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadCachedGeocode(
  client: SupabaseClient,
  latBucket: number,
  lonBucket: number,
  locale: string
): Promise<GeocodeCacheRow | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from('weather_geocode_cache')
    .select('location_name, country_code, expires_at')
    .eq('lat_bucket', latBucket)
    .eq('lon_bucket', lonBucket)
    .eq('locale', locale)
    .gt('expires_at', nowIso)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as GeocodeCacheRow | null;
}

async function upsertGeocodeCache(
  client: SupabaseClient,
  latBucket: number,
  lonBucket: number,
  locale: string,
  locationName: string,
  countryCode: string | null
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + GEOCODE_CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await client
    .from('weather_geocode_cache')
    .upsert({
      lat_bucket: latBucket,
      lon_bucket: lonBucket,
      locale,
      location_name: locationName,
      country_code: countryCode,
      expires_at: expiresAt,
      updated_at: now.toISOString(),
    });
}

async function resolveGeocode(
  req: Request,
  latitude: number,
  longitude: number,
  logger: ReturnType<typeof createLogger>
): Promise<GeocodeResult> {
  const adminClient = getAdminClient();
  const locale = getLocaleFromRequest(req);
  const latBucket = bucketCoordinate(latitude);
  const lonBucket = bucketCoordinate(longitude);

  if (adminClient) {
    const cached = await loadCachedGeocode(adminClient, latBucket, lonBucket, locale);
    if (cached) {
      return {
        locationName: cached.location_name,
        countryCode: cached.country_code,
        provider: 'cache',
        fromCache: true,
      };
    }
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${locale}`;

  try {
    const nominatim = await fetchJsonWithRetry<{
      address?: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        country_code?: string;
      };
    }>({
      url: nominatimUrl,
      provider: 'nominatim',
      timeoutMs: GEO_TIMEOUT_MS,
      maxAttempts: 2,
      headers: { 'User-Agent': 'Ally/1.0 (https://allybywaiter.com)' },
    });

    const address = nominatim.data.address || {};
    const city = address.city || address.town || address.village || address.county;
    const state = address.state;
    const countryCode = address.country_code?.toUpperCase() || null;

    if (city) {
      const parts = [city, state, countryCode].filter(Boolean);
      const locationName = parts.join(', ');

      if (adminClient) {
        await upsertGeocodeCache(adminClient, latBucket, lonBucket, locale, locationName, countryCode);
      }

      return {
        locationName,
        countryCode,
        provider: nominatim.provider,
        fromCache: false,
      };
    }
  } catch (error) {
    logger.warn('Nominatim geocode failed', { error: error instanceof Error ? error.message : String(error) });
  }

  // Fallback: Open-Meteo reverse geocoding.
  const fallbackUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=${locale}&format=json`;
  try {
    const fallback = await fetchJsonWithRetry<{
      results?: Array<{
        name?: string;
        admin1?: string;
        country_code?: string;
      }>;
    }>({
      url: fallbackUrl,
      provider: 'open-meteo-geocode',
      timeoutMs: GEO_TIMEOUT_MS,
      maxAttempts: 2,
    });

    const first = fallback.data.results?.[0];
    const countryCode = first?.country_code?.toUpperCase() || null;
    const locationName = [first?.name, first?.admin1, countryCode].filter(Boolean).join(', ');

    if (locationName && adminClient) {
      await upsertGeocodeCache(adminClient, latBucket, lonBucket, locale, locationName, countryCode);
    }

    return {
      locationName: locationName || null,
      countryCode,
      provider: fallback.provider,
      fromCache: false,
    };
  } catch (error) {
    logger.warn('Fallback geocode failed', { error: error instanceof Error ? error.message : String(error) });
  }

  return {
    locationName: null,
    countryCode: null,
    provider: 'none',
    fromCache: false,
  };
}

function buildOpenWeatherFallback(weatherRaw: {
  current: {
    weather?: Array<{ id?: number }>;
    main?: { temp?: number; feels_like?: number; humidity?: number; pressure?: number };
    wind?: { speed?: number; deg?: number };
    clouds?: { all?: number };
    visibility?: number;
    dt?: number;
    sys?: { sunrise?: number; sunset?: number };
  };
  forecast: {
    list?: Array<{
      dt_txt?: string;
      dt?: number;
      main?: { temp?: number; temp_min?: number; temp_max?: number };
      weather?: Array<{ id?: number }>;
      wind?: { speed?: number; deg?: number };
      pop?: number;
      rain?: { ['3h']?: number };
      snow?: { ['3h']?: number };
    }>;
  };
}) {
  const nowCode = weatherRaw.current.weather?.[0]?.id ?? 800;
  const nowCondition = mapOpenWeatherCode(nowCode);

  const list = weatherRaw.forecast.list || [];

  const hourlyForecast = list.slice(0, 24).map((entry) => ({
    time: entry.dt_txt || new Date((entry.dt ?? 0) * 1000).toISOString(),
    temperature: Math.round(entry.main?.temp ?? 0),
    condition: mapOpenWeatherCode(entry.weather?.[0]?.id ?? 800),
    isDay: true,
    precipitationProbability: Math.round((entry.pop ?? 0) * 100),
    precipitation: (entry.rain?.['3h'] ?? entry.snow?.['3h'] ?? 0),
  }));

  const byDay = new Map<string, {
    temps: number[];
    wind: number[];
    windDir: number[];
    weatherCodes: number[];
    pop: number[];
    precip: number[];
  }>();

  for (const entry of list) {
    const iso = entry.dt_txt || new Date((entry.dt ?? 0) * 1000).toISOString();
    const day = iso.slice(0, 10);
    if (!byDay.has(day)) {
      byDay.set(day, {
        temps: [],
        wind: [],
        windDir: [],
        weatherCodes: [],
        pop: [],
        precip: [],
      });
    }

    const bucket = byDay.get(day)!;
    if (typeof entry.main?.temp_max === 'number') bucket.temps.push(entry.main.temp_max);
    if (typeof entry.main?.temp_min === 'number') bucket.temps.push(entry.main.temp_min);
    if (typeof entry.wind?.speed === 'number') bucket.wind.push(entry.wind.speed * 3.6);
    if (typeof entry.wind?.deg === 'number') bucket.windDir.push(entry.wind.deg);
    if (typeof entry.weather?.[0]?.id === 'number') bucket.weatherCodes.push(entry.weather[0].id);
    if (typeof entry.pop === 'number') bucket.pop.push(entry.pop * 100);
    bucket.precip.push((entry.rain?.['3h'] ?? entry.snow?.['3h'] ?? 0));
  }

  const forecast = Array.from(byDay.entries()).slice(0, 10).map(([date, bucket]) => {
    const avgWindDir = bucket.windDir.length
      ? Math.round(bucket.windDir.reduce((sum, value) => sum + value, 0) / bucket.windDir.length)
      : 0;

    return {
      date,
      condition: mapOpenWeatherCode(bucket.weatherCodes[0] ?? nowCode),
      tempMax: Math.round(Math.max(...bucket.temps, weatherRaw.current.main?.temp ?? 0)),
      tempMin: Math.round(Math.min(...bucket.temps, weatherRaw.current.main?.temp ?? 0)),
      windSpeed: Math.round(bucket.wind.length ? Math.max(...bucket.wind) : (weatherRaw.current.wind?.speed ?? 0) * 3.6),
      windDirection: avgWindDir,
      uvIndexMax: 0,
      precipitationProbabilityMax: Math.round(Math.max(...bucket.pop, 0)),
      precipitationSum: Number(bucket.precip.reduce((sum, value) => sum + value, 0).toFixed(2)),
    };
  });

  return {
    condition: nowCondition,
    weatherCode: nowCode,
    temperature: Math.round(weatherRaw.current.main?.temp ?? 0),
    feelsLike: Math.round(weatherRaw.current.main?.feels_like ?? weatherRaw.current.main?.temp ?? 0),
    temperatureUnit: 'celsius',
    windSpeed: Math.round((weatherRaw.current.wind?.speed ?? 0) * 3.6),
    windDirection: Math.round(weatherRaw.current.wind?.deg ?? 0),
    humidity: Math.round(weatherRaw.current.main?.humidity ?? 0),
    uvIndex: 0,
    isDay: true,
    fetchedAt: new Date().toISOString(),
    sunrise: weatherRaw.current.sys?.sunrise ? new Date(weatherRaw.current.sys.sunrise * 1000).toISOString() : null,
    sunset: weatherRaw.current.sys?.sunset ? new Date(weatherRaw.current.sys.sunset * 1000).toISOString() : null,
    hourlyForecast,
    forecast,
    precipitationProbability: hourlyForecast[0]?.precipitationProbability ?? 0,
    precipitationAmount: hourlyForecast[0]?.precipitation ?? 0,
    pressure: Math.round(weatherRaw.current.main?.pressure ?? 0),
    pressureTrend: 'steady' as const,
    dewPoint: 0,
    cloudCover: Math.round(weatherRaw.current.clouds?.all ?? 0),
    visibility: Math.round((weatherRaw.current.visibility ?? 10000) / 1000),
  };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger('get-weather');

  try {
    const identifier = extractIdentifier(req);
    const rateLimitResult = await checkRateLimit({
      maxRequests: 15,
      windowMs: 60 * 1000,
      identifier: `weather:${identifier}`,
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult, req);
    }

    const body = await req.json();
    const latitude = body?.latitude;
    const longitude = body?.longitude;
    const locationSource = normalizeLocationSource(body?.locationSource);
    const locationAccuracyMeters = typeof body?.locationAccuracyMeters === 'number'
      ? Math.round(body.locationAccuracyMeters)
      : null;

    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day,uv_index,` +
      `precipitation,surface_pressure,dew_point_2m,cloud_cover,visibility` +
      `&hourly=temperature_2m,weather_code,is_day,precipitation_probability,precipitation,surface_pressure` +
      `&forecast_hours=24` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset,` +
      `precipitation_probability_max,precipitation_sum` +
      `&forecast_days=10&timezone=auto`;

    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
      `&current=us_aqi,pm10,pm2_5`;

    let provider = 'open-meteo';
    let coreWeather: {
      condition: string;
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
      hourlyForecast: Array<{
        time: string;
        temperature: number;
        condition: string;
        isDay: boolean;
        precipitationProbability: number;
        precipitation: number;
      }>;
      forecast: Array<{
        date: string;
        condition: string;
        tempMax: number;
        tempMin: number;
        windSpeed: number;
        windDirection: number;
        uvIndexMax: number;
        precipitationProbabilityMax: number;
        precipitationSum: number;
      }>;
      precipitationProbability: number;
      precipitationAmount: number;
      pressure: number;
      pressureTrend: 'rising' | 'falling' | 'steady';
      dewPoint: number;
      cloudCover: number;
      visibility: number;
    };

    try {
      const weather = await fetchJsonWithRetry<{
        current?: {
          weather_code: number;
          temperature_2m: number;
          apparent_temperature: number;
          wind_speed_10m: number;
          wind_direction_10m: number;
          relative_humidity_2m: number;
          is_day: number;
          uv_index: number;
          precipitation: number;
          surface_pressure: number;
          dew_point_2m: number;
          cloud_cover: number;
          visibility: number;
        };
        hourly?: {
          time?: string[];
          temperature_2m?: number[];
          weather_code?: number[];
          is_day?: number[];
          precipitation_probability?: number[];
          precipitation?: number[];
          surface_pressure?: number[];
        };
        daily?: {
          time?: string[];
          weather_code?: number[];
          temperature_2m_max?: number[];
          temperature_2m_min?: number[];
          wind_speed_10m_max?: number[];
          wind_direction_10m_dominant?: number[];
          uv_index_max?: number[];
          precipitation_probability_max?: number[];
          precipitation_sum?: number[];
          sunrise?: string[];
          sunset?: string[];
        };
      }>({
        url: weatherUrl,
        provider: 'open-meteo',
        timeoutMs: WEATHER_TIMEOUT_MS,
        maxAttempts: 3,
      });

      if (!weather.data.current) {
        throw new Error('Open-Meteo payload missing current weather');
      }

      const current = weather.data.current;
      const hourlyForecast = [];
      const hourly = weather.data.hourly;
      if (hourly?.time) {
        for (let i = 0; i < Math.min(hourly.time.length, 24); i += 1) {
          hourlyForecast.push({
            time: hourly.time[i],
            temperature: Math.round(hourly.temperature_2m?.[i] ?? 0),
            condition: mapWeatherCode(hourly.weather_code?.[i] ?? current.weather_code),
            isDay: (hourly.is_day?.[i] ?? current.is_day) === 1,
            precipitationProbability: Math.round(hourly.precipitation_probability?.[i] ?? 0),
            precipitation: hourly.precipitation?.[i] ?? 0,
          });
        }
      }

      const forecast = [];
      const daily = weather.data.daily;
      if (daily?.time) {
        for (let i = 0; i < daily.time.length; i += 1) {
          forecast.push({
            date: daily.time[i],
            condition: mapWeatherCode(daily.weather_code?.[i] ?? current.weather_code),
            tempMax: Math.round(daily.temperature_2m_max?.[i] ?? current.temperature_2m),
            tempMin: Math.round(daily.temperature_2m_min?.[i] ?? current.temperature_2m),
            windSpeed: Math.round(daily.wind_speed_10m_max?.[i] ?? current.wind_speed_10m),
            windDirection: Math.round(daily.wind_direction_10m_dominant?.[i] ?? current.wind_direction_10m ?? 0),
            uvIndexMax: Math.round(daily.uv_index_max?.[i] ?? 0),
            precipitationProbabilityMax: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
            precipitationSum: daily.precipitation_sum?.[i] ?? 0,
          });
        }
      }

      provider = weather.provider;
      coreWeather = {
        condition: mapWeatherCode(current.weather_code),
        weatherCode: current.weather_code,
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        temperatureUnit: 'celsius',
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: Math.round(current.wind_direction_10m ?? 0),
        humidity: Math.round(current.relative_humidity_2m),
        uvIndex: Math.round(current.uv_index ?? 0),
        isDay: current.is_day === 1,
        fetchedAt: new Date().toISOString(),
        sunrise: daily?.sunrise?.[0] ?? null,
        sunset: daily?.sunset?.[0] ?? null,
        hourlyForecast,
        forecast,
        precipitationProbability: hourlyForecast[0]?.precipitationProbability ?? 0,
        precipitationAmount: current.precipitation ?? 0,
        pressure: Math.round(current.surface_pressure ?? 0),
        pressureTrend: getPressureTrend(hourly?.surface_pressure ?? []),
        dewPoint: Math.round(current.dew_point_2m ?? 0),
        cloudCover: Math.round(current.cloud_cover ?? 0),
        visibility: Math.round((current.visibility ?? 10000) / 1000),
      };
    } catch (primaryError) {
      const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY') || '';
      if (!openWeatherApiKey) {
        throw primaryError;
      }

      logger.warn('Primary weather provider failed, using fallback', {
        error: primaryError instanceof Error ? primaryError.message : String(primaryError),
      });

      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${openWeatherApiKey}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${openWeatherApiKey}`;

      const [currentResp, forecastResp] = await Promise.all([
        fetchJsonWithRetry<{
          weather?: Array<{ id?: number }>;
          main?: { temp?: number; feels_like?: number; humidity?: number; pressure?: number };
          wind?: { speed?: number; deg?: number };
          clouds?: { all?: number };
          visibility?: number;
          dt?: number;
          sys?: { sunrise?: number; sunset?: number };
        }>({
          url: currentUrl,
          provider: 'openweather-current',
          timeoutMs: WEATHER_TIMEOUT_MS,
          maxAttempts: 2,
        }),
        fetchJsonWithRetry<{
          list?: Array<{
            dt_txt?: string;
            dt?: number;
            main?: { temp?: number; temp_min?: number; temp_max?: number };
            weather?: Array<{ id?: number }>;
            wind?: { speed?: number; deg?: number };
            pop?: number;
            rain?: { ['3h']?: number };
            snow?: { ['3h']?: number };
          }>;
        }>({
          url: forecastUrl,
          provider: 'openweather-forecast',
          timeoutMs: WEATHER_TIMEOUT_MS,
          maxAttempts: 2,
        }),
      ]);

      provider = 'openweather';
      coreWeather = buildOpenWeatherFallback({
        current: currentResp.data,
        forecast: forecastResp.data,
      });
    }

    let airQuality: {
      aqi: number;
      pm25: number;
      pm10: number;
      category: string;
    } | null = null;

    try {
      const aq = await fetchJsonWithRetry<{
        current?: {
          us_aqi?: number;
          pm2_5?: number;
          pm10?: number;
        };
      }>({
        url: airQualityUrl,
        provider: 'open-meteo-air-quality',
        timeoutMs: AIR_QUALITY_TIMEOUT_MS,
        maxAttempts: 2,
      });

      if (aq.data.current) {
        const aqi = Math.round(aq.data.current.us_aqi ?? 0);
        airQuality = {
          aqi,
          pm25: Math.round(aq.data.current.pm2_5 ?? 0),
          pm10: Math.round(aq.data.current.pm10 ?? 0),
          category: getAQICategory(aqi),
        };
      }
    } catch (error) {
      logger.warn('Air quality provider failed', { error: error instanceof Error ? error.message : String(error) });
    }

    const geocode = await resolveGeocode(req, latitude, longitude, logger);
    const moonPhase = getMoonPhase(new Date());
    const fetchedAt = new Date().toISOString();

    const weatherData = {
      ...coreWeather,
      fetchedAt,
      locationName: geocode.locationName,
      airQuality,
      moonPhase,
      meta: {
        provider,
        source: 'live',
        fetchedAt,
        dataAgeSeconds: 0,
        isStale: false,
        locationSource,
        locationAccuracyMeters,
        alertCoverage: getAlertCoverage(geocode.countryCode),
      },
    };

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Error fetching weather', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch weather data',
        code: 'WEATHER_PROVIDER_FAILURE',
      }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
