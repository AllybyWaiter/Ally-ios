import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

export function DashboardHeroBanner() {
  const { imagePath, greeting } = useTimeOfDay();
  const { userName } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState(imagePath);

  // Handle smooth transition when image changes
  useEffect(() => {
    if (imagePath !== currentImage) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        setCurrentImage(imagePath);
        setImageLoaded(true);
      };
      img.src = imagePath;
    }
  }, [imagePath, currentImage]);

  // Initial load
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = currentImage;
  }, []);

  const firstName = userName?.split(' ')[0];
  const personalizedGreeting = firstName ? `${greeting}, ${firstName}` : greeting;

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
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground drop-shadow-lg">
          {personalizedGreeting}
        </h2>
      </div>
    </div>
  );
}
