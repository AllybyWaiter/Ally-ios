import { Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Sun, Moon } from 'lucide-react';
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
  const time = parseISO(hour.time);
  
  return (
    <div 
      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg min-w-[60px] transition-colors ${
        isNow 
          ? 'bg-primary/10 ring-1 ring-primary/30' 
          : 'hover:bg-muted/50'
      }`}
    >
      <span className={`text-xs font-medium ${isNow ? 'text-primary' : 'text-muted-foreground'}`}>
        {isNow ? 'Now' : format(time, 'h a')}
      </span>
      <Icon className={`h-5 w-5 ${hour.isDay ? 'text-amber-500' : 'text-slate-400'}`} />
      <span className="text-sm font-semibold">
        {formatTemperature(hour.temperature, units, 'C')}
      </span>
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
            {weather.hourlyForecast.map((hour, index) => {
              const time = parseISO(hour.time);
              const isNow = isThisHour(time);
              
              return (
                <HourlyItem 
                  key={hour.time} 
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
