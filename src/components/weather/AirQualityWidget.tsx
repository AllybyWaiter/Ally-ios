import { Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AirQuality } from '@/hooks/useWeather';
import { getAQILevel } from '@/lib/unitConversions';

interface AirQualityWidgetProps {
  airQuality: AirQuality | null;
}

export function AirQualityWidget({ airQuality }: AirQualityWidgetProps) {
  if (!airQuality) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wind className="h-4 w-4" />
            Air Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Air quality data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const aqiLevel = getAQILevel(airQuality.aqi);
  const aqiPercentage = Math.min((airQuality.aqi / 300) * 100, 100);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wind className="h-4 w-4" />
          Air Quality Index
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AQI Score and Label */}
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-3xl font-bold ${aqiLevel.colorClass}`}>
              {airQuality.aqi}
            </span>
            <span className={`ml-2 text-sm font-medium ${aqiLevel.colorClass}`}>
              {aqiLevel.label}
            </span>
          </div>
        </div>

        {/* AQI Progress Bar */}
        <div className="space-y-1">
          <Progress 
            value={aqiPercentage} 
            className="h-2"
            style={{
              background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #a855f7, #881337)'
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Good</span>
            <span>Hazardous</span>
          </div>
        </div>

        {/* Particulate Matter */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">PM2.5</p>
            <p className="text-sm font-semibold">{airQuality.pm25} μg/m³</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">PM10</p>
            <p className="text-sm font-semibold">{airQuality.pm10} μg/m³</p>
          </div>
        </div>

        {/* Health Advice */}
        <p className="text-xs text-muted-foreground italic">
          {aqiLevel.advice}
        </p>
      </CardContent>
    </Card>
  );
}
