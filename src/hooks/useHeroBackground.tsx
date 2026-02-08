import { useState, useEffect, useRef, useCallback } from 'react';
import { useWeather, WeatherCondition } from '@/hooks/useWeather';

type TimeSlot = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';

interface HeroBackgroundInfo {
  currentImage: string;
  previousImage: string | null;
  isTransitioning: boolean;
  slot: TimeSlot;
  weather: WeatherCondition | null;
}

const _TIME_SLOTS: Record<TimeSlot, { start: number; end: number }> = {
  'dawn': { start: 5, end: 8 },
  'morning': { start: 8, end: 12 },
  'afternoon': { start: 12, end: 17 },
  'evening': { start: 17, end: 20 },
  'night': { start: 20, end: 23 },
  'late-night': { start: 23, end: 5 },
};

function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late-night';
}

function getImagePath(slot: TimeSlot, weather: WeatherCondition | null, weatherEnabled: boolean): string {
  // Use dashboard images - they already exist
  if (weatherEnabled && weather && weather !== 'clear') {
    const weatherVariant = weather === 'storm' ? 'rain' : weather === 'fog' ? 'cloudy' : weather;
    return `/images/dashboard/${slot}-${weatherVariant}.jpg`;
  }
  return `/images/dashboard/${slot}.jpg`;
}

// Preload an image and return a promise
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src;
  });
}

export function useHeroBackground(): HeroBackgroundInfo {
  const { weather: weatherData, enabled: weatherEnabled } = useWeather();
  const weatherCondition = weatherData?.condition || null;
  
  const [state, setState] = useState<HeroBackgroundInfo>(() => {
    const hour = new Date().getHours();
    const slot = getTimeSlot(hour);
    return {
      currentImage: getImagePath(slot, weatherCondition, weatherEnabled),
      previousImage: null,
      isTransitioning: false,
      slot,
      weather: weatherCondition,
    };
  });

  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const transitionToImage = useCallback(async (newImage: string, slot: TimeSlot, weather: WeatherCondition | null) => {
    // Preload the new image
    try {
      await preloadImage(newImage);
    } catch {
      // If preload fails, still try to transition
    }

    setState(prev => ({
      ...prev,
      previousImage: prev.currentImage,
      currentImage: newImage,
      isTransitioning: true,
      slot,
      weather,
    }));

    // End transition after animation completes
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        previousImage: null,
        isTransitioning: false,
      }));
    }, 1000); // Match CSS transition duration
  }, []);

  // Update when weather changes
  useEffect(() => {
    const hour = new Date().getHours();
    const slot = getTimeSlot(hour);
    const newImage = getImagePath(slot, weatherCondition, weatherEnabled);

    if (newImage !== state.currentImage) {
      transitionToImage(newImage, slot, weatherCondition);
    }
  }, [weatherCondition, weatherEnabled, state.currentImage, transitionToImage]);

  // Check for time slot changes every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const slot = getTimeSlot(hour);
      const newImage = getImagePath(slot, weatherCondition, weatherEnabled);

      if (newImage !== state.currentImage) {
        transitionToImage(newImage, slot, weatherCondition);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [weatherCondition, weatherEnabled, state.currentImage, transitionToImage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return state;
}
