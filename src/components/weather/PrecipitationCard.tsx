import { Droplets, Umbrella, CloudRain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HourlyForecast } from '@/hooks/useWeather';
import { formatPrecipitation, UnitSystem } from '@/lib/unitConversions';

const FORECAST_WINDOW_HOURS = 12;

const toSafePercent = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, n));
};

const toSafeAmount = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, n);
};

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
  const currentPrecipProbability = toSafePercent(precipitationProbability);
  const currentPrecipAmount = toSafeAmount(precipitationAmount);
  const upcomingHours = hourlyForecast.slice(0, FORECAST_WINDOW_HOURS);

  // Normalize to a full 12-hour series so UI continuity is preserved even with sparse API data.
  const next12Hours = Array.from({ length: FORECAST_WINDOW_HOURS }, (_, index) => {
    const hour = upcomingHours[index];
    return {
      precipitationProbability: toSafePercent(hour?.precipitationProbability),
      precipitation: toSafeAmount(hour?.precipitation),
    };
  });

  const hasHourlyValues = upcomingHours
    .some((hour) =>
      typeof hour?.precipitationProbability === 'number' || typeof hour?.precipitation === 'number'
    );
  // The chart visualizes precipitation *chance*.
  // Keep a visible placeholder whenever all upcoming chance values are effectively zero.
  const hasMeaningfulChanceSignal = next12Hours.some(
    (hour) => hour.precipitationProbability >= 1
  );
  const showZeroPlaceholder = !hasMeaningfulChanceSignal;
  const placeholderLabel = hasHourlyValues
    ? '0% / no precipitation expected'
    : '0% / no data';
  const placeholderSummary = hasHourlyValues
    ? 'No precipitation expected in the next 12 hours, showing 0% placeholders.'
    : 'No hourly precipitation values available, showing 0% placeholders.';

  const maxPrecipProb = Math.max(...next12Hours.map((h) => h.precipitationProbability), 0);
  const totalPrecip = next12Hours.reduce((sum, h) => sum + h.precipitation, 0);
  const needsUmbrella = Math.max(currentPrecipProbability, maxPrecipProb) >= 50;

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
              currentPrecipProbability >= 60 ? 'bg-blue-500/20' : 
              currentPrecipProbability >= 30 ? 'bg-blue-400/15' : 
              'bg-muted/50'
            }`}>
              {needsUmbrella ? (
                <Umbrella className="h-6 w-6 text-blue-500" />
              ) : (
                <CloudRain className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{currentPrecipProbability}%</p>
              <p className="text-xs text-muted-foreground">Chance of rain now</p>
            </div>
          </div>
          {currentPrecipAmount > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold">{formatPrecipitation(currentPrecipAmount, units)}</p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
          )}
        </div>

        {/* 12-Hour Forecast Bar Chart */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Next 12 hours</p>
          <div className="relative">
            <div className="flex items-end gap-1 h-12">
              {next12Hours.map((hour, index) => {
                const height = showZeroPlaceholder ? 18 : Math.max(hour.precipitationProbability, 8);
                return (
                  <div key={index} className="flex-1 h-full flex items-end">
                    <div 
                      data-testid="precip-hour-bar"
                      aria-label={`Hour ${index + 1}: ${hour.precipitationProbability}% precipitation chance`}
                      className={`w-full rounded-t transition-all ${
                        showZeroPlaceholder ? 'bg-muted-foreground/35' :
                        hour.precipitationProbability >= 60 ? 'bg-blue-500' :
                        hour.precipitationProbability >= 30 ? 'bg-blue-400/70' :
                        hour.precipitationProbability > 0 ? 'bg-blue-300/50' :
                        'bg-muted/30'
                      }`}
                      style={{
                        height: `${height}%`,
                        minHeight: showZeroPlaceholder ? '6px' : undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            {showZeroPlaceholder && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {placeholderLabel}
                </span>
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Now</span>
            <span>+12h</span>
          </div>
          {showZeroPlaceholder && (
            <p className="text-[11px] text-muted-foreground">
              {placeholderSummary}
            </p>
          )}
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
