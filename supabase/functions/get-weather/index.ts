import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, rateLimitExceededResponse, extractIdentifier } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Open-Meteo weather codes to simplified conditions
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

// Calculate moon phase mathematically
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
  
  // Calculate days until next full and new moon
  const daysUntilFull = phase < 14.77 ? 14.77 - phase : LUNAR_CYCLE - phase + 14.77;
  const daysUntilNew = phase < 1.85 ? 1.85 - phase : LUNAR_CYCLE - phase + 1.85;
  
  return { 
    phase: phaseName, 
    illumination, 
    emoji,
    dayInCycle: Math.round(phase),
    daysUntilFull: Math.round(daysUntilFull),
    daysUntilNew: Math.round(daysUntilNew)
  };
}

// Get AQI category from US AQI value
function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// Determine pressure trend from hourly data
function getPressureTrend(hourlyPressure: number[]): 'rising' | 'falling' | 'steady' {
  if (!hourlyPressure || hourlyPressure.length < 6) return 'steady';
  
  const recent = hourlyPressure.slice(0, 6);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const latest = recent[0];
  const oldest = recent[recent.length - 1];
  const diff = latest - oldest;
  
  if (diff > 2) return 'rising';
  if (diff < -2) return 'falling';
  return 'steady';
}

serve(async (req) => {
  const logger = createLogger('get-weather');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Invalid auth token', { error: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.setUserId(user.id);

    // Apply rate limiting: 100 requests per hour per user
    const rateLimitResult = checkRateLimit({
      maxRequests: 100,
      windowMs: 60 * 60 * 1000, // 1 hour
      identifier: extractIdentifier(req, user.id),
    }, logger);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { latitude, longitude } = await req.json();
    
    if (!latitude || !longitude) {
      logger.warn('Missing coordinates', { latitude, longitude });
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Fetching weather', { latitude, longitude });

    // Enhanced Open-Meteo URL with precipitation, pressure, dew point, cloud cover, visibility
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,uv_index,` +
      `precipitation,surface_pressure,dew_point_2m,cloud_cover,visibility` +
      `&hourly=temperature_2m,weather_code,is_day,precipitation_probability,precipitation,surface_pressure` +
      `&forecast_hours=24` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,uv_index_max,sunrise,sunset,` +
      `precipitation_probability_max,precipitation_sum` +
      `&forecast_days=10&timezone=auto`;
    
    // Air Quality API (separate endpoint)
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
      `&current=us_aqi,pm10,pm2_5&hourly=us_aqi`;
    
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`;
    
    // Fetch all data in parallel
    const [weatherResponse, airQualityResponse, nominatimResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(airQualityUrl).catch(() => null),
      fetch(nominatimUrl, {
        headers: { 'User-Agent': 'Ally/1.0 (https://allybywaiter.com)' }
      }).catch(() => null)
    ]);
    
    if (!weatherResponse.ok) {
      logger.error('Open-Meteo API error', { status: weatherResponse.status });
      throw new Error(`Weather API returned ${weatherResponse.status}`);
    }

    const data = await weatherResponse.json();
    
    if (!data.current) {
      logger.error('No current weather in response', data);
      throw new Error('Invalid weather data received');
    }

    const { 
      weather_code, 
      temperature_2m, 
      apparent_temperature, 
      wind_speed_10m, 
      relative_humidity_2m, 
      is_day, 
      uv_index,
      precipitation: currentPrecipitation,
      surface_pressure,
      dew_point_2m,
      cloud_cover,
      visibility
    } = data.current;
    
    const condition = mapWeatherCode(weather_code);

    // Parse air quality data
    let airQuality = null;
    if (airQualityResponse && airQualityResponse.ok) {
      try {
        const aqData = await airQualityResponse.json();
        if (aqData.current) {
          airQuality = {
            aqi: Math.round(aqData.current.us_aqi ?? 0),
            pm25: Math.round(aqData.current.pm2_5 ?? 0),
            pm10: Math.round(aqData.current.pm10 ?? 0),
            category: getAQICategory(aqData.current.us_aqi ?? 0)
          };
        }
      } catch (e) {
        logger.warn('Failed to parse air quality data', e);
      }
    }

    // Calculate pressure trend from hourly data
    const pressureTrend = getPressureTrend(data.hourly?.surface_pressure ?? []);

    // Build hourly forecast array with precipitation
    const hourlyForecast = [];
    if (data.hourly && data.hourly.time) {
      for (let i = 0; i < Math.min(data.hourly.time.length, 24); i++) {
        hourlyForecast.push({
          time: data.hourly.time[i],
          temperature: Math.round(data.hourly.temperature_2m[i]),
          condition: mapWeatherCode(data.hourly.weather_code[i]),
          isDay: data.hourly.is_day[i] === 1,
          precipitationProbability: Math.round(data.hourly.precipitation_probability?.[i] ?? 0),
          precipitation: data.hourly.precipitation?.[i] ?? 0,
        });
      }
    }

    // Build 10-day forecast array with precipitation
    const forecast = [];
    if (data.daily && data.daily.time) {
      for (let i = 0; i < data.daily.time.length; i++) {
        forecast.push({
          date: data.daily.time[i],
          condition: mapWeatherCode(data.daily.weather_code[i]),
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          windSpeed: Math.round(data.daily.wind_speed_10m_max[i]),
          uvIndexMax: Math.round(data.daily.uv_index_max?.[i] ?? 0),
          precipitationProbabilityMax: Math.round(data.daily.precipitation_probability_max?.[i] ?? 0),
          precipitationSum: data.daily.precipitation_sum?.[i] ?? 0,
        });
      }
    }

    // Extract today's sunrise/sunset
    const sunrise = data.daily?.sunrise?.[0] ?? null;
    const sunset = data.daily?.sunset?.[0] ?? null;

    // Calculate moon phase
    const moonPhase = getMoonPhase(new Date());

    // Parse location name from Nominatim response
    let locationName: string | null = null;
    if (nominatimResponse && nominatimResponse.ok) {
      try {
        const geoData = await nominatimResponse.json();
        const address = geoData.address || {};
        const city = address.city || address.town || address.village || address.county || address.municipality;
        const state = address.state;
        const countryCode = address.country_code?.toUpperCase();
        
        if (city) {
          const parts = [city];
          if (state) parts.push(state);
          if (countryCode) parts.push(countryCode);
          locationName = parts.join(', ');
        }
      } catch (e) {
        logger.warn('Failed to parse Nominatim response', e);
      }
    }

    const weatherData = {
      condition,
      weatherCode: weather_code,
      temperature: Math.round(temperature_2m),
      feelsLike: Math.round(apparent_temperature),
      temperatureUnit: 'celsius',
      windSpeed: Math.round(wind_speed_10m),
      humidity: Math.round(relative_humidity_2m),
      uvIndex: Math.round(uv_index ?? 0),
      isDay: is_day === 1,
      fetchedAt: new Date().toISOString(),
      sunrise,
      sunset,
      locationName,
      hourlyForecast,
      forecast,
      
      precipitationProbability: hourlyForecast[0]?.precipitationProbability ?? 0,
      precipitationAmount: currentPrecipitation ?? 0,
      
      airQuality,
      
      pressure: Math.round(surface_pressure ?? 0),
      pressureTrend,
      dewPoint: Math.round(dew_point_2m ?? 0),
      cloudCover: Math.round(cloud_cover ?? 0),
      visibility: Math.round((visibility ?? 10000) / 1000), // Convert m to km
      
      moonPhase,
    };

    logger.info('Weather fetched successfully', { 
      condition, 
      temperature: temperature_2m, 
      hourlyCount: hourlyForecast.length, 
      forecastDays: forecast.length, 
      locationName,
      hasAirQuality: !!airQuality,
      moonPhase: moonPhase.phase
    });

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Error fetching weather', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
