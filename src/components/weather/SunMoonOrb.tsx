import { WeatherCondition } from '@/hooks/useWeather';
import { Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';

interface SunMoonOrbProps {
  isDay: boolean;
  condition: WeatherCondition;
  sunProgress?: number; // 0-1, where 0.5 is solar noon
}

export function SunMoonOrb({ isDay, condition, sunProgress = 0.5 }: SunMoonOrbProps) {
  // Weather overlay icons for non-clear conditions
  const weatherOverlay: Record<WeatherCondition, React.ElementType | null> = {
    clear: null,
    cloudy: Cloud,
    rain: CloudRain,
    snow: CloudSnow,
    storm: CloudLightning,
    fog: CloudFog,
  };

  const OverlayIcon = weatherOverlay[condition];

  return (
    <div className="relative">
      {/* Glow Effect */}
      <div 
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
          isDay 
            ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 opacity-60' 
            : 'bg-gradient-to-br from-slate-400 via-blue-200 to-slate-300 opacity-40'
        }`}
        style={{ transform: 'scale(1.3)' }}
      />
      
      {/* Main Orb */}
      <div 
        className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all duration-500 ${
          isDay
            ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500'
            : 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-500 dark:via-slate-600 dark:to-slate-700'
        }`}
      >
        {/* Inner glow/texture */}
        <div 
          className={`absolute inset-2 rounded-full ${
            isDay
              ? 'bg-gradient-to-br from-yellow-200/80 to-transparent'
              : 'bg-gradient-to-br from-slate-100/30 to-transparent dark:from-slate-400/30'
          }`}
        />
        
        {/* Sun rays (only during day) */}
        {isDay && condition === 'clear' && (
          <>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-3 bg-gradient-to-r from-amber-400 to-transparent rounded-full animate-pulse"
                style={{
                  transform: `rotate(${i * 45}deg) translateX(44px)`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </>
        )}

        {/* Moon craters (only at night) */}
        {!isDay && (
          <>
            <div className="absolute top-3 left-4 h-2 w-2 rounded-full bg-slate-400/30 dark:bg-slate-800/30" />
            <div className="absolute top-6 right-4 h-3 w-3 rounded-full bg-slate-400/20 dark:bg-slate-800/20" />
            <div className="absolute bottom-4 left-6 h-1.5 w-1.5 rounded-full bg-slate-400/25 dark:bg-slate-800/25" />
          </>
        )}

        {/* Center icon/emoji */}
        <span className="relative z-10 text-3xl">
          {isDay ? '☀️' : '🌙'}
        </span>
      </div>

      {/* Weather overlay badge */}
      {OverlayIcon && condition !== 'clear' && (
        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md border border-border">
          <OverlayIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Subtle orbiting particle (decorative) */}
      <div 
        className={`absolute h-2 w-2 rounded-full animate-spin ${
          isDay ? 'bg-amber-300/60' : 'bg-blue-200/40'
        }`}
        style={{ 
          animationDuration: '8s',
          top: '50%',
          left: '50%',
          transformOrigin: '-30px 0',
        }}
      />
    </div>
  );
}
