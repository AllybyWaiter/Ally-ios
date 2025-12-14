import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Open-Meteo weather codes to simplified conditions
function mapWeatherCode(code: number): string {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'cloudy'; // Partly cloudy
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain'; // Drizzle and rain
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain'; // Rain showers
  if (code >= 85 && code <= 86) return 'snow'; // Snow showers
  if (code >= 95 && code <= 99) return 'storm'; // Thunderstorm
  return 'clear'; // Default
}

serve(async (req) => {
  const logger = createLogger('get-weather');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();
    
    if (!latitude || !longitude) {
      logger.warn('Missing coordinates', { latitude, longitude });
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Fetching weather', { latitude, longitude });

    // Call Open-Meteo API with current weather, humidity, feels-like, UV, and 5-day forecast
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,uv_index_max&forecast_days=5&timezone=auto`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      logger.error('Open-Meteo API error', { status: response.status });
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.current) {
      logger.error('No current weather in response', data);
      throw new Error('Invalid weather data received');
    }

    const { weather_code, temperature_2m, apparent_temperature, wind_speed_10m, relative_humidity_2m, is_day, uv_index } = data.current;
    const condition = mapWeatherCode(weather_code);

    // Build forecast array
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
        });
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
      forecast,
    };

    logger.info('Weather fetched successfully', { condition, temperature: temperature_2m, forecastDays: forecast.length });

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
