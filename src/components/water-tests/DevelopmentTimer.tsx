import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, Camera, Play, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevelopmentTimerProps {
  developmentTimes: Record<string, number>; // parameter name → seconds
  kitName?: string;
  onTimerComplete: () => void; // triggers "take photo now"
}

type TimerState = 'idle' | 'running' | 'complete';

export function DevelopmentTimer({
  developmentTimes,
  kitName,
  onTimerComplete,
}: DevelopmentTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeCalledRef = useRef(false);

  // Find the longest development time (all params develop on same strip/at same time)
  const maxDevTime = Math.max(...Object.values(developmentTimes), 0);
  const devTimeMinutes = Math.ceil(maxDevTime / 60);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startTimer = () => {
    cleanup();
    completeCalledRef.current = false;
    setTotalSeconds(maxDevTime);
    setSecondsRemaining(maxDevTime);
    setTimerState('running');

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          cleanup();
          setTimerState('complete');
          if (!completeCalledRef.current) {
            completeCalledRef.current = true;
            onTimerComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    cleanup();
    setTimerState('idle');
    setSecondsRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  if (maxDevTime === 0) return null;

  // Build per-parameter time breakdown
  const paramTimes = Object.entries(developmentTimes)
    .filter(([_, secs]) => secs > 0)
    .sort((a, b) => a[1] - b[1]);

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Development Timer</span>
        {kitName && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            {kitName}
          </Badge>
        )}
      </div>

      {timerState === 'idle' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Dip your test and start the timer. We'll tell you when it's time to photograph.
            {paramTimes.length > 1 && ` Wait the full ${devTimeMinutes} min for all parameters to develop.`}
          </p>

          {paramTimes.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {paramTimes.map(([param, secs]) => (
                <Badge key={param} variant="secondary" className="text-[10px]">
                  {param}: {Math.ceil(secs / 60)}m
                </Badge>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={startTimer}
          >
            <Play className="h-3 w-3" />
            Start Timer ({devTimeMinutes} min)
          </Button>
        </div>
      )}

      {timerState === 'running' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold tabular-nums">
              {formatTime(secondsRemaining)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetTimer}
              className="h-7 gap-1 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Show which params are ready */}
          <div className="flex flex-wrap gap-1">
            {paramTimes.map(([param, secs]) => {
              const elapsed = totalSeconds - secondsRemaining;
              const ready = elapsed >= secs;
              return (
                <Badge
                  key={param}
                  variant={ready ? 'default' : 'secondary'}
                  className={cn('text-[10px] transition-colors', ready && 'bg-green-600')}
                >
                  {ready && <Check className="h-2.5 w-2.5 mr-0.5" />}
                  {param}
                </Badge>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Keep your test kit still and undisturbed...
          </p>
        </div>
      )}

      {timerState === 'complete' && (
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Camera className="h-5 w-5" />
            <span className="font-semibold">Ready! Take your photo now.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Colors are at peak development. Photograph immediately for best accuracy.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetTimer}
            className="text-xs gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Restart
          </Button>
        </div>
      )}
    </div>
  );
}
