import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudFog } from 'lucide-react';

const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudRain,
  fog: CloudFog,
};

// Check WebP support once
let webpSupported: boolean | null = null;
function checkWebPSupport(): Promise<boolean> {
  if (webpSupported !== null) return Promise.resolve(webpSupported);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webpSupported = img.width > 0 && img.height > 0;
      resolve(webpSupported);
    };
    img.onerror = () => {
      webpSupported = false;
      resolve(false);
    };
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

// Preload an image and return the working path
async function loadImageWithFallback(webpPath: string, jpgPath: string): Promise<string> {
  const supportsWebP = await checkWebPSupport();
  
  // Try WebP first if supported
  if (supportsWebP) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(webpPath);
      img.onerror = () => {
        // WebP file doesn't exist, fallback to JPG
        const jpgImg = new Image();
        jpgImg.onload = () => resolve(jpgPath);
        jpgImg.onerror = () => resolve(jpgPath); // Return JPG path anyway
        jpgImg.src = jpgPath;
      };
      img.src = webpPath;
    });
  }
  
  // Load JPG directly
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(jpgPath);
    img.onerror = () => resolve(jpgPath);
    img.src = jpgPath;
  });
}

// Full-page background component with WebP support and lazy loading
export function DashboardBackground() {
  const { imagePathWebP, imagePathJpg, weather, weatherEnabled } = useTimeOfDay();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  // Load image with WebP fallback
  useEffect(() => {
    let cancelled = false;
    
    async function loadImage() {
      setImageLoaded(false);
      
      try {
        const imagePath = await loadImageWithFallback(imagePathWebP, imagePathJpg);
        
        if (!cancelled) {
          // Handle weather variant fallback
          const img = new Image();
          img.onload = () => {
            if (!cancelled) {
              setCurrentImage(imagePath);
              setImageLoaded(true);
              hasLoaded.current = true;
            }
          };
          img.onerror = () => {
            if (!cancelled) {
              // Fallback to non-weather variant
              const fallbackPath = imagePathJpg.replace(/-(?:rain|cloudy|snow)\.(webp|jpg)$/, '.jpg');
              setCurrentImage(fallbackPath);
              setImageLoaded(true);
              hasLoaded.current = true;
            }
          };
          img.src = imagePath;
        }
      } catch {
        if (!cancelled) {
          setCurrentImage(imagePathJpg);
          setImageLoaded(true);
        }
      }
    }
    
    loadImage();
    
    return () => {
      cancelled = true;
    };
  }, [imagePathWebP, imagePathJpg]);

  return (
    <>
      {/* Fixed full-screen background image */}
      <div
        ref={containerRef}
        className={`fixed inset-0 bg-cover bg-center transition-opacity duration-1000 z-0 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: currentImage ? `url(${currentImage})` : undefined }}
      />
      
      {/* Fallback gradient while loading */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 transition-opacity duration-1000 z-0 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Overlay for content readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/70 z-0" />
    </>
  );
}

// Safe personalization helper - handles special characters and edge cases
function personalizeGreeting(greeting: string, firstName: string | undefined): string {
  if (!firstName || !greeting) return greeting || '';
  
  // Check for common punctuation at end
  const lastChar = greeting.slice(-1);
  if (['?', '!', '.'].includes(lastChar)) {
    return `${greeting.slice(0, -1)}, ${firstName}${lastChar}`;
  }
  return `${greeting}, ${firstName}`;
}

// Greeting overlay component (shows on top of content)
export function DashboardGreeting() {
  const { greeting, weather, weatherEnabled } = useTimeOfDay();
  const { userName } = useAuth();
  
  const firstName = userName?.split(' ')[0];
  const personalizedGreeting = personalizeGreeting(greeting, firstName);
  
  const WeatherIcon = weather && WEATHER_ICONS[weather] ? WEATHER_ICONS[weather] : null;

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

// Legacy banner export for backward compatibility with WebP support
export function DashboardHeroBanner() {
  const { imagePathWebP, imagePathJpg, greeting, weather, weatherEnabled } = useTimeOfDay();
  const { userName } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState('');

  // Load image with WebP fallback
  useEffect(() => {
    let cancelled = false;
    
    async function loadImage() {
      setImageLoaded(false);
      
      try {
        const imagePath = await loadImageWithFallback(imagePathWebP, imagePathJpg);
        
        if (!cancelled) {
          const img = new Image();
          img.onload = () => {
            if (!cancelled) {
              setCurrentImage(imagePath);
              setImageLoaded(true);
            }
          };
          img.onerror = () => {
            if (!cancelled) {
              // Fallback to non-weather variant
              const fallbackPath = imagePathJpg.replace(/-(?:rain|cloudy|snow)\.(webp|jpg)$/, '.jpg');
              setCurrentImage(fallbackPath);
              setImageLoaded(true);
            }
          };
          img.src = imagePath;
        }
      } catch {
        if (!cancelled) {
          setCurrentImage(imagePathJpg);
          setImageLoaded(true);
        }
      }
    }
    
    loadImage();
    
    return () => {
      cancelled = true;
    };
  }, [imagePathWebP, imagePathJpg]);

  const firstName = userName?.split(' ')[0];
  const personalizedGreeting = personalizeGreeting(greeting, firstName);
  
  const WeatherIcon = weather && WEATHER_ICONS[weather] ? WEATHER_ICONS[weather] : null;

  return (
    <div className="relative w-full h-48 md:h-64 lg:h-72 overflow-hidden">
      {/* Background Image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: currentImage ? `url(${currentImage})` : undefined }}
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
