import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

const BeforeAfterSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleMove(clientX);
    };

    const handleGlobalUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDragging, handleMove]);

  const handleMouseDown = () => setIsDragging(true);

  return (
    <Card className="relative w-full overflow-hidden select-none touch-none">
      <div
        ref={containerRef}
        className="relative w-full aspect-video cursor-ew-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* After Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-cover"
            draggable="false"
          />
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
            {afterLabel}
          </div>
        </div>

        {/* Before Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-cover"
            draggable="false"
          />
          <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold">
            {beforeLabel}
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-background cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-background rounded-full border-4 border-primary flex items-center justify-center shadow-lg">
            <div className="flex gap-1">
              <div className="w-0.5 h-4 bg-primary"></div>
              <div className="w-0.5 h-4 bg-primary"></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BeforeAfterSlider;
