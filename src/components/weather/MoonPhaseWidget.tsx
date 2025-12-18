import { Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoonPhase } from '@/hooks/useWeather';

interface MoonPhaseWidgetProps {
  moonPhase: MoonPhase;
}

export function MoonPhaseWidget({ moonPhase }: MoonPhaseWidgetProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Moon Phase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Moon Visual */}
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-600 dark:to-slate-800 text-4xl shadow-inner">
              {moonPhase.emoji}
            </div>
            {/* Illumination Ring */}
            <div 
              className="absolute inset-0 rounded-full border-2 border-amber-400/50"
              style={{
                clipPath: `polygon(0 0, ${moonPhase.illumination}% 0, ${moonPhase.illumination}% 100%, 0 100%)`
              }}
            />
          </div>

          {/* Moon Info */}
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold">{moonPhase.phase}</p>
            <p className="text-sm text-muted-foreground">
              {moonPhase.illumination}% illuminated
            </p>
            <p className="text-xs text-muted-foreground">
              Day {moonPhase.dayInCycle} of lunar cycle
            </p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Next Full Moon</p>
            <p className="text-sm font-medium">
              {moonPhase.daysUntilFull === 0 ? 'Tonight!' : `${moonPhase.daysUntilFull} days`}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Next New Moon</p>
            <p className="text-sm font-medium">
              {moonPhase.daysUntilNew === 0 ? 'Tonight!' : `${moonPhase.daysUntilNew} days`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
