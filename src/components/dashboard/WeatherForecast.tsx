import { Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Sun, SunDim } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeather, WeatherCondition, ForecastDay } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { formatTemperature, getUVLevel } from '@/lib/unitConversions';
import { format, parseISO } from 'date-fns';

const weatherIcons: Record<WeatherCondition, React.ElementType> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};

interface ForecastDayCardProps {
  day: ForecastDay;
  units: 'metric' | 'imperial' | null;
}

function ForecastDayCard({ day, units }: ForecastDayCardProps) {
  const WeatherIcon = weatherIcons[day.condition] || Cloud;
  const dayName = format(parseISO(day.date), 'EEE');
  
  const highTemp = formatTemperature(day.tempMax, units, 'C');
  const lowTemp = formatTemperature(day.tempMin, units, 'C');
  const uvLevel = getUVLevel(day.uvIndexMax);

  return (
    <div className="flex flex-col items-center gap-1 min-w-[4rem] py-2">
      <span className="text-xs font-medium text-muted-foreground">{dayName}</span>
      <WeatherIcon className="h-5 w-5 text-primary" />
      <div className="flex flex-col items-center text-xs">
        <span className="font-semibold">{highTemp}</span>
        <span className="text-muted-foreground">{lowTemp}</span>
      </div>
      {day.uvIndexMax != null && day.uvIndexMax > 0 && (
        <div className="flex items-center gap-0.5 text-[10px]">
          <SunDim className="h-3 w-3" />
          <span className={uvLevel.colorClass}>{day.uvIndexMax}</span>
        </div>
      )}
    </div>
  );
}

export function WeatherForecast() {
  const { weather, enabled, error } = useWeather();
  const { units } = useAuth();

  // Don't render if weather is not enabled, has error, or no forecast
  if (!enabled || error || !weather?.forecast || weather.forecast.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">5-Day Forecast</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex justify-between overflow-x-auto">
          {weather.forecast.map((day, index) => (
            <ForecastDayCard key={`${day.date}-${index}`} day={day} units={units} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
