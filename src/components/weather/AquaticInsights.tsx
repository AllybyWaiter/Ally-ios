import { Lightbulb, Droplets, Sun, CloudRain, Wind, Thermometer, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherData } from '@/hooks/useWeather';
import { useMemo } from 'react';

interface AquaticInsightsProps {
  weather: WeatherData;
}

interface Insight {
  icon: React.ElementType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function AquaticInsights({ weather }: AquaticInsightsProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];

    // High UV insights
    if (weather.uvIndex >= 8) {
      result.push({
        icon: Sun,
        title: 'High UV Alert',
        description: 'UV degrades chlorine faster. Check sanitizer levels more frequently today.',
        priority: 'high'
      });
    } else if (weather.uvIndex >= 6) {
      result.push({
        icon: Sun,
        title: 'Elevated UV',
        description: 'Consider testing chlorine levels this afternoon.',
        priority: 'medium'
      });
    }

    // Temperature insights
    if (weather.temperature >= 32) { // 32°C = ~90°F
      result.push({
        icon: Thermometer,
        title: 'Hot Weather',
        description: 'Warm conditions increase algae growth. Monitor water clarity and brush walls.',
        priority: 'high'
      });
    }

    // Rain insights
    const rainExpected = weather.forecast.slice(0, 3).some(d => d.precipitationProbabilityMax >= 60);
    if (rainExpected) {
      result.push({
        icon: CloudRain,
        title: 'Rain Forecast',
        description: 'Rain dilutes chemicals and affects pH. Plan to test water after the storm passes.',
        priority: 'medium'
      });
    }

    // Current precipitation
    if (weather.precipitationProbability >= 70) {
      result.push({
        icon: Droplets,
        title: 'Rain Today',
        description: 'Postpone chemical treatments until dry weather returns.',
        priority: 'medium'
      });
    }

    // Wind insights
    if (weather.windSpeed >= 25) {
      result.push({
        icon: Wind,
        title: 'Windy Conditions',
        description: 'Wind blows debris into pools. Check skimmer baskets and consider using a cover.',
        priority: 'low'
      });
    }

    // Pressure insights (for fish tanks)
    if (weather.pressureTrend === 'falling') {
      result.push({
        icon: AlertTriangle,
        title: 'Pressure Dropping',
        description: 'Fish may be less active or show reduced appetite. Normal behavior, no action needed.',
        priority: 'low'
      });
    }

    // Air quality insights
    if (weather.airQuality && weather.airQuality.aqi >= 100) {
      result.push({
        icon: Wind,
        title: 'Poor Air Quality',
        description: 'Pollutants can settle on outdoor water surfaces. Consider running filters longer.',
        priority: 'medium'
      });
    }

    // Humidity insights
    if (weather.humidity >= 85) {
      result.push({
        icon: Droplets,
        title: 'High Humidity',
        description: 'Evaporation will be minimal. Great time for chemical treatments.',
        priority: 'low'
      });
    } else if (weather.humidity <= 30) {
      result.push({
        icon: Droplets,
        title: 'Low Humidity',
        description: 'Expect increased evaporation. Keep water levels topped up.',
        priority: 'low'
      });
    }

    // If no specific insights, provide general guidance
    if (result.length === 0) {
      result.push({
        icon: Lightbulb,
        title: 'Good Conditions',
        description: 'Weather is favorable for regular maintenance. Stick to your normal schedule.',
        priority: 'low'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [weather]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Aquatic Care Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 4).map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div 
              key={index}
              className={`flex items-start gap-3 rounded-lg p-2 ${
                insight.priority === 'high' ? 'bg-orange-500/10 border border-orange-500/20' :
                insight.priority === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                'bg-muted/50'
              }`}
            >
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                insight.priority === 'high' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                'bg-primary/10 text-primary'
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
