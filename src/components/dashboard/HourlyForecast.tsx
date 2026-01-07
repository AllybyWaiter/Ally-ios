import { Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Sun, Moon, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useWeather, WeatherCondition, HourlyForecast as HourlyForecastType } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { formatTemperature } from '@/lib/unitConversions';
import { format, parseISO, isThisHour } from 'date-fns';

const weatherIcons: Record<WeatherCondition, { day: React.ElementType; night: React.ElementType }> = {
  clear: { day: Sun, night: Moon },
  cloudy: { day: Cloud, night: Cloud },
  rain: { day: CloudRain, night: CloudRain },
  snow: { day: CloudSnow, night: CloudSnow },
  storm: { day: CloudLightning, night: CloudLightning },
  fog: { day: CloudFog, night: CloudFog },
};

interface HourlyItemProps {
  hour: HourlyForecastType;
  units: 'metric' | 'imperial' | null;
  isNow: boolean;
}

function HourlyItem({ hour, units, isNow }: HourlyItemProps) {
  const icons = weatherIcons[hour.condition] || weatherIcons.clear;
  const Icon = hour.isDay ? icons.day : icons.night;
  const showPrecip = hour.precipitationProbability != null && hour.precipitationProbability >= 20;
  
  // Safe time parsing
  let parsedTime: Date;
  let formattedTime = '--';
  try {
    parsedTime = parseISO(hour.time);
    formattedTime = isNow ? 'Now' : format(parsedTime, 'h a');
  } catch {
    parsedTime = new Date();
  }
  
  return (
    <div 
      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg min-w-[60px] transition-colors ${
        isNow 
          ? 'bg-primary/10 ring-1 ring-primary/30' 
          : 'hover:bg-muted/50'
      }`}
    >
      <span className={`text-xs font-medium ${isNow ? 'text-primary' : 'text-muted-foreground'}`}>
        {formattedTime}
      </span>
      <Icon className={`h-5 w-5 ${hour.isDay ? 'text-amber-500' : 'text-slate-400'}`} />
      <span className="text-sm font-semibold">
        {formatTemperature(hour.temperature, units, 'C')}
      </span>
      {showPrecip && (
        <div className="flex items-center gap-0.5 text-blue-500">
          <Droplets className="h-3 w-3" />
          <span className="text-[10px] font-medium">{hour.precipitationProbability}%</span>
        </div>
      )}
    </div>
  );
}

export function HourlyForecast() {
  const { weather } = useWeather();
  const { units } = useAuth();

  if (!weather?.hourlyForecast || weather.hourlyForecast.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Today's Forecast</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-1">
            {weather.hourlyForecast.map((hour) => {
              let isNow = false;
              try {
                const time = parseISO(hour.time);
                isNow = isThisHour(time);
              } catch {
                isNow = false;
              }
              
              return (
                <HourlyItem 
                  key={hour.time || crypto.randomUUID()} 
                  hour={hour} 
                  units={units} 
                  isNow={isNow}
                />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
