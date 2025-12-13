import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudFog } from 'lucide-react';

const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudRain,
  fog: CloudFog,
};

// Full-page background component
export function DashboardBackground() {
  const { imagePath, weather, weatherEnabled } = useTimeOfDay();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState(imagePath);

  useEffect(() => {
    if (imagePath !== currentImage) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        setCurrentImage(imagePath);
        setImageLoaded(true);
      };
      img.onerror = () => {
        const fallbackPath = imagePath.replace(/-(?:rain|cloudy|snow)\.jpg$/, '.jpg');
        if (fallbackPath !== imagePath) {
          setCurrentImage(fallbackPath);
          setImageLoaded(true);
        }
      };
      img.src = imagePath;
    }
  }, [imagePath, currentImage]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      const fallbackPath = currentImage.replace(/-(?:rain|cloudy|snow)\.jpg$/, '.jpg');
      if (fallbackPath !== currentImage) {
        setCurrentImage(fallbackPath);
        const fallbackImg = new Image();
        fallbackImg.onload = () => setImageLoaded(true);
        fallbackImg.src = fallbackPath;
      }
    };
    img.src = currentImage;
  }, []);

  return (
    <>
      {/* Fixed full-screen background image */}
      <div
        className={`fixed inset-0 bg-cover bg-center transition-opacity duration-1000 z-0 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${currentImage})` }}
      />
      
      {/* Fallback gradient while loading */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 transition-opacity duration-1000 z-0 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Overlay for content readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background/90 z-0" />
    </>
  );
}

// Greeting overlay component (shows on top of content)
export function DashboardGreeting() {
  const { greeting, weather, weatherEnabled } = useTimeOfDay();
  const { userName } = useAuth();
  
  const firstName = userName?.split(' ')[0];
  const personalizedGreeting = firstName ? `${greeting}, ${firstName}` : greeting;
  
  const WeatherIcon = weather ? WEATHER_ICONS[weather] : null;

  return (
    <div className="flex items-center gap-3 mb-6">
      {weatherEnabled && WeatherIcon && (
        <WeatherIcon className="h-7 w-7 md:h-8 md:w-8 text-foreground/80 drop-shadow-lg" />
      )}
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground drop-shadow-lg">
        {personalizedGreeting}
      </h2>
    </div>
  );
}

// Legacy banner export for backward compatibility
export function DashboardHeroBanner() {
  const { imagePath, greeting, weather, weatherEnabled } = useTimeOfDay();
  const { userName } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState(imagePath);
  const [fallbackToDefault, setFallbackToDefault] = useState(false);

  // Handle smooth transition when image changes
  useEffect(() => {
    if (imagePath !== currentImage) {
      setImageLoaded(false);
      setFallbackToDefault(false);
      const img = new Image();
      img.onload = () => {
        setCurrentImage(imagePath);
        setImageLoaded(true);
      };
      img.onerror = () => {
        // If weather-specific image fails, fallback to time-only image
        const fallbackPath = imagePath.replace(/-(?:rain|cloudy|snow)\.jpg$/, '.jpg');
        if (fallbackPath !== imagePath) {
          setFallbackToDefault(true);
          setCurrentImage(fallbackPath);
          setImageLoaded(true);
        }
      };
      img.src = imagePath;
    }
  }, [imagePath, currentImage]);

  // Initial load
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      // Fallback to time-only on initial load error
      const fallbackPath = currentImage.replace(/-(?:rain|cloudy|snow)\.jpg$/, '.jpg');
      if (fallbackPath !== currentImage) {
        setCurrentImage(fallbackPath);
        const fallbackImg = new Image();
        fallbackImg.onload = () => setImageLoaded(true);
        fallbackImg.src = fallbackPath;
      }
    };
    img.src = currentImage;
  }, []);

  const firstName = userName?.split(' ')[0];
  const personalizedGreeting = firstName ? `${greeting}, ${firstName}` : greeting;
  
  const WeatherIcon = weather ? WEATHER_ICONS[weather] : null;

  return (
    <div className="relative w-full h-48 md:h-64 lg:h-72 overflow-hidden">
      {/* Background Image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${currentImage})` }}
      />
      
      {/* Fallback gradient while loading */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 transition-opacity duration-700 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="flex items-center gap-3">
          {weatherEnabled && WeatherIcon && (
            <WeatherIcon className="h-6 w-6 md:h-8 md:w-8 text-foreground/80 drop-shadow-lg" />
          )}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground drop-shadow-lg">
            {personalizedGreeting}
          </h2>
        </div>
      </div>
    </div>
  );
}
