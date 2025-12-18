import { Droplets, Umbrella, CloudRain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HourlyForecast } from '@/hooks/useWeather';
import { formatPrecipitation, UnitSystem } from '@/lib/unitConversions';
import { format, parseISO } from 'date-fns';

interface PrecipitationCardProps {
  precipitationProbability: number;
  precipitationAmount: number;
  hourlyForecast: HourlyForecast[];
  units: UnitSystem | null;
}

export function PrecipitationCard({
  precipitationProbability,
  precipitationAmount,
  hourlyForecast,
  units
}: PrecipitationCardProps) {
  // Get next 12 hours of precipitation data
  const next12Hours = hourlyForecast.slice(0, 12);
  const maxPrecipProb = Math.max(...next12Hours.map(h => h.precipitationProbability), 0);
  const totalPrecip = next12Hours.reduce((sum, h) => sum + h.precipitation, 0);
  
  const needsUmbrella = maxPrecipProb >= 50;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          Precipitation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rain Chance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              precipitationProbability >= 60 ? 'bg-blue-500/20' : 
              precipitationProbability >= 30 ? 'bg-blue-400/15' : 
              'bg-muted/50'
            }`}>
              {needsUmbrella ? (
                <Umbrella className="h-6 w-6 text-blue-500" />
              ) : (
                <CloudRain className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{precipitationProbability}%</p>
              <p className="text-xs text-muted-foreground">Chance of rain now</p>
            </div>
          </div>
          {precipitationAmount > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold">{formatPrecipitation(precipitationAmount, units)}</p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
          )}
        </div>

        {/* 12-Hour Forecast Bar Chart */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Next 12 hours</p>
          <div className="flex items-end gap-1 h-12">
            {next12Hours.map((hour, index) => {
              const height = Math.max(hour.precipitationProbability, 5);
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-0.5">
                  <div 
                    className={`w-full rounded-t transition-all ${
                      hour.precipitationProbability >= 60 ? 'bg-blue-500' :
                      hour.precipitationProbability >= 30 ? 'bg-blue-400/70' :
                      hour.precipitationProbability > 0 ? 'bg-blue-300/50' :
                      'bg-muted/30'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Now</span>
            <span>+12h</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
          <div>
            <p className="text-xs text-muted-foreground">Expected total</p>
            <p className="text-sm font-semibold">{formatPrecipitation(totalPrecip, units)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Peak chance</p>
            <p className="text-sm font-semibold">{maxPrecipProb}%</p>
          </div>
        </div>

        {/* Recommendation */}
        {needsUmbrella && (
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Umbrella className="h-3 w-3" />
            Consider bringing an umbrella today
          </p>
        )}
      </CardContent>
    </Card>
  );
}
