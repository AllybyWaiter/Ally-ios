import { useState, useEffect } from 'react';
import { useWeather, WeatherCondition } from '@/hooks/useWeather';

type TimeSlot = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';

interface TimeOfDayInfo {
  slot: TimeSlot;
  imagePath: string;
  imagePathWebP: string;
  imagePathJpg: string;
  greeting: string;
  weather: WeatherCondition | null;
  weatherEnabled: boolean;
}

const TIME_SLOTS: Record<TimeSlot, { start: number; end: number; greeting: string }> = {
  'dawn': { start: 5, end: 8, greeting: 'Good morning' },
  'morning': { start: 8, end: 12, greeting: 'Good morning' },
  'afternoon': { start: 12, end: 17, greeting: 'Good afternoon' },
  'evening': { start: 17, end: 20, greeting: 'Good evening' },
  'night': { start: 20, end: 23, greeting: 'Good evening' },
  'late-night': { start: 23, end: 5, greeting: 'Burning the midnight oil?' },
};

const WEATHER_GREETINGS: Record<WeatherCondition, Record<string, string>> = {
  clear: {
    dawn: 'Beautiful sunrise!',
    morning: 'Perfect morning!',
    afternoon: 'Lovely afternoon!',
    evening: 'Clear evening!',
    night: 'Clear night!',
    'late-night': 'Starry night!',
  },
  cloudy: {
    dawn: 'Cloudy dawn.',
    morning: 'Overcast morning.',
    afternoon: 'Cloudy but cozy!',
    evening: 'Quiet evening.',
    night: 'Cloudy night.',
    'late-night': 'Peaceful night.',
  },
  rain: {
    dawn: 'Rainy morning.',
    morning: 'Rainy day ahead!',
    afternoon: 'Stay dry!',
    evening: 'Cozy rainy evening!',
    night: 'Rainy night.',
    'late-night': 'Late night rain.',
  },
  snow: {
    dawn: 'Snowy morning!',
    morning: 'Winter wonderland!',
    afternoon: 'Snowy afternoon!',
    evening: 'Snowy evening!',
    night: 'Quiet snowy night.',
    'late-night': 'Snowfall tonight!',
  },
  storm: {
    dawn: 'Stormy morning!',
    morning: 'Stay safe!',
    afternoon: 'Storm brewing!',
    evening: 'Stormy evening!',
    night: 'Stormy night!',
    'late-night': 'Late night storm!',
  },
  fog: {
    dawn: 'Misty morning.',
    morning: 'Foggy day.',
    afternoon: 'Hazy afternoon.',
    evening: 'Foggy evening.',
    night: 'Misty night.',
    'late-night': 'Quiet foggy night.',
  },
};

function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late-night';
}

function getImageBasePath(slot: TimeSlot, weather: WeatherCondition | null, weatherEnabled: boolean): string {
  // If weather is enabled and we have weather data, try weather-specific image
  if (weatherEnabled && weather && weather !== 'clear') {
    // Weather variants: rain, cloudy, snow (fog and storm can fallback to cloudy/rain)
    const weatherVariant = weather === 'storm' ? 'rain' : weather === 'fog' ? 'cloudy' : weather;
    return `/images/dashboard/${slot}-${weatherVariant}`;
  }
  // Default to time-only image
  return `/images/dashboard/${slot}`;
}

function getImagePaths(slot: TimeSlot, weather: WeatherCondition | null, weatherEnabled: boolean) {
  const basePath = getImageBasePath(slot, weather, weatherEnabled);
  return {
    webp: `${basePath}.webp`,
    jpg: `${basePath}.jpg`,
    // Default to JPG until WebP versions are available
    default: `${basePath}.jpg`,
  };
}

function getGreeting(slot: TimeSlot, weather: WeatherCondition | null, weatherEnabled: boolean): string {
  if (weatherEnabled && weather) {
    return WEATHER_GREETINGS[weather]?.[slot] || TIME_SLOTS[slot].greeting;
  }
  return TIME_SLOTS[slot].greeting;
}

export function useTimeOfDay(): TimeOfDayInfo {
  const { weather: weatherData, enabled: weatherEnabled } = useWeather();
  const weatherCondition = weatherData?.condition || null;
  
  const [timeInfo, setTimeInfo] = useState<TimeOfDayInfo>(() => {
    const hour = new Date().getHours();
    const slot = getTimeSlot(hour);
    const paths = getImagePaths(slot, weatherCondition, weatherEnabled);
    return {
      slot,
      imagePath: paths.default,
      imagePathWebP: paths.webp,
      imagePathJpg: paths.jpg,
      greeting: getGreeting(slot, weatherCondition, weatherEnabled),
      weather: weatherCondition,
      weatherEnabled,
    };
  });

  // Update when weather changes
  useEffect(() => {
    const hour = new Date().getHours();
    const slot = getTimeSlot(hour);
    const paths = getImagePaths(slot, weatherCondition, weatherEnabled);
    
    setTimeInfo({
      slot,
      imagePath: paths.default,
      imagePathWebP: paths.webp,
      imagePathJpg: paths.jpg,
      greeting: getGreeting(slot, weatherCondition, weatherEnabled),
      weather: weatherCondition,
      weatherEnabled,
    });
  }, [weatherCondition, weatherEnabled]);

  useEffect(() => {
    // Check every minute for time slot changes
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const slot = getTimeSlot(hour);
      
      setTimeInfo(prev => {
        if (prev.slot !== slot || prev.weather !== weatherCondition || prev.weatherEnabled !== weatherEnabled) {
          const paths = getImagePaths(slot, weatherCondition, weatherEnabled);
          return {
            slot,
            imagePath: paths.default,
            imagePathWebP: paths.webp,
            imagePathJpg: paths.jpg,
            greeting: getGreeting(slot, weatherCondition, weatherEnabled),
            weather: weatherCondition,
            weatherEnabled,
          };
        }
        return prev;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [weatherCondition, weatherEnabled]);

  return timeInfo;
}
