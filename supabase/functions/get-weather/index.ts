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

    // Call Open-Meteo API (free, no API key required)
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      logger.error('Open-Meteo API error', { status: response.status });
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.current_weather) {
      logger.error('No current weather in response', data);
      throw new Error('Invalid weather data received');
    }

    const { weathercode, temperature, windspeed, is_day } = data.current_weather;
    const condition = mapWeatherCode(weathercode);

    const weatherData = {
      condition,
      weatherCode: weathercode,
      temperature: Math.round(temperature),
      temperatureUnit: 'celsius',
      windSpeed: Math.round(windspeed),
      isDay: is_day === 1,
      fetchedAt: new Date().toISOString(),
    };

    logger.info('Weather fetched successfully', { condition, temperature });

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
