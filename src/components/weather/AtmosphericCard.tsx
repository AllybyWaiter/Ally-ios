import { Gauge, Eye, Cloud, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  formatPressure, 
  formatVisibility, 
  getComfortLevel, 
  getPressureTrendIcon,
  formatTemperature,
  UnitSystem 
} from '@/lib/unitConversions';

interface AtmosphericCardProps {
  pressure: number;
  pressureTrend: 'rising' | 'falling' | 'steady';
  dewPoint: number;
  cloudCover: number;
  visibility: number;
  units: UnitSystem | null;
}

export function AtmosphericCard({
  pressure,
  pressureTrend,
  dewPoint,
  cloudCover,
  visibility,
  units
}: AtmosphericCardProps) {
  const comfortLevel = getComfortLevel(dewPoint);
  const trendInfo = getPressureTrendIcon(pressureTrend);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Atmospheric Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {/* Pressure */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" />
              <span className="text-xs">Pressure</span>
            </div>
            <p className="text-sm font-semibold">{formatPressure(pressure, units)}</p>
            <div className="flex items-center gap-1 text-xs">
              <span className={pressureTrend === 'rising' ? 'text-green-500' : pressureTrend === 'falling' ? 'text-orange-500' : 'text-muted-foreground'}>
                {trendInfo.icon}
              </span>
              <span className="text-muted-foreground">{trendInfo.label}</span>
            </div>
          </div>

          {/* Dew Point */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Thermometer className="h-3.5 w-3.5" />
              <span className="text-xs">Dew Point</span>
            </div>
            <p className="text-sm font-semibold">{formatTemperature(dewPoint, units, 'C')}</p>
            <p className={`text-xs ${comfortLevel.colorClass}`}>{comfortLevel.label}</p>
          </div>

          {/* Cloud Cover */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Cloud className="h-3.5 w-3.5" />
              <span className="text-xs">Cloud Cover</span>
            </div>
            <p className="text-sm font-semibold">{cloudCover}%</p>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/60 rounded-full transition-all"
                style={{ width: `${cloudCover}%` }}
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs">Visibility</span>
            </div>
            <p className="text-sm font-semibold">{formatVisibility(visibility, units)}</p>
            <p className="text-xs text-muted-foreground">
              {visibility >= 10 ? 'Excellent' : visibility >= 5 ? 'Good' : visibility >= 2 ? 'Moderate' : 'Poor'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
