import { Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCardinalDirection, formatWindSpeed } from '@/lib/unitConversions';

type UnitSystem = 'metric' | 'imperial';

interface WindCompassWidgetProps {
  windDirection: number | null;
  windSpeed: number;
  units: UnitSystem | null;
}

export function WindCompassWidget({ windDirection, windSpeed, units }: WindCompassWidgetProps) {
  if (windDirection === null || windDirection === undefined) {
    return null;
  }

  const cardinalDirection = getCardinalDirection(windDirection);
  const formattedSpeed = formatWindSpeed(windSpeed, units);
  
  // Cardinal direction descriptions
  const directionDescriptions: Record<string, string> = {
    'N': 'North',
    'NE': 'Northeast',
    'E': 'East',
    'SE': 'Southeast',
    'S': 'South',
    'SW': 'Southwest',
    'W': 'West',
    'NW': 'Northwest',
  };

  return (
    <Card className="bg-card/60 backdrop-blur-md border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          Wind Compass
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="flex flex-col items-center"
          aria-label={`Wind coming from ${directionDescriptions[cardinalDirection]} at ${formattedSpeed}`}
        >
          {/* Compass SVG */}
          <div className="relative w-40 h-40">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
            >
              {/* Outer circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
              />
              
              {/* Inner circle */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              
              {/* Tick marks for all 16 directions */}
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 22.5 - 90) * (Math.PI / 180);
                const isCardinal = i % 4 === 0;
                const isOrdinal = i % 2 === 0 && !isCardinal;
                const innerRadius = isCardinal ? 75 : isOrdinal ? 80 : 83;
                const outerRadius = 90;
                
                return (
                  <line
                    key={i}
                    x1={100 + innerRadius * Math.cos(angle)}
                    y1={100 + innerRadius * Math.sin(angle)}
                    x2={100 + outerRadius * Math.cos(angle)}
                    y2={100 + outerRadius * Math.sin(angle)}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={isCardinal ? 2 : 1}
                    opacity={isCardinal ? 1 : isOrdinal ? 0.7 : 0.4}
                  />
                );
              })}
              
              {/* Cardinal direction labels - positioned inside the tick marks */}
              <text x="100" y="32" textAnchor="middle" className="fill-foreground text-sm font-semibold">N</text>
              <text x="168" y="105" textAnchor="middle" className="fill-foreground text-sm font-semibold">E</text>
              <text x="100" y="178" textAnchor="middle" className="fill-foreground text-sm font-semibold">S</text>
              <text x="32" y="105" textAnchor="middle" className="fill-foreground text-sm font-semibold">W</text>

              {/* Ordinal direction labels (smaller) - positioned inside the tick marks */}
              <text x="145" y="60" textAnchor="middle" className="fill-muted-foreground text-xs">NE</text>
              <text x="145" y="150" textAnchor="middle" className="fill-muted-foreground text-xs">SE</text>
              <text x="55" y="150" textAnchor="middle" className="fill-muted-foreground text-xs">SW</text>
              <text x="55" y="60" textAnchor="middle" className="fill-muted-foreground text-xs">NW</text>
              
              {/* Wind direction arrow - points in direction wind is flowing TO */}
              <g
                style={{
                  transform: `rotate(${windDirection}deg)`,
                  transformOrigin: '100px 100px',
                  transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Tail (where wind comes from) */}
                <line
                  x1="100"
                  y1="35"
                  x2="100"
                  y2="100"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                {/* Arrow shaft */}
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="150"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Arrow head pointing down (direction wind flows TO) */}
                <polygon
                  points="100,165 92,145 100,150 108,145"
                  className="fill-primary"
                />
              </g>
              
              {/* Center circle */}
              <circle
                cx="100"
                cy="100"
                r="8"
                className="fill-primary"
              />
              <circle
                cx="100"
                cy="100"
                r="4"
                className="fill-background"
              />
            </svg>
          </div>
          
          {/* Wind info text */}
          <div className="text-center mt-3 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-foreground">{cardinalDirection}</span>
              <span className="text-lg text-muted-foreground">at</span>
              <span className="text-2xl font-bold text-foreground">{formattedSpeed}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Wind from {directionDescriptions[cardinalDirection]}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
