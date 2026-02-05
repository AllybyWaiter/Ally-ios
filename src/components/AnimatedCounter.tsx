import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  suffix?: string;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  formatValue,
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const diff = endValue - startValue;

    if (diff === 0) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * easeOut;

      setDisplayValue(Math.round(currentValue * 100) / 100);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = formatValue
    ? formatValue(displayValue)
    : displayValue.toLocaleString();

  return (
    <span className={className}>
      {formattedValue}
      {suffix}
    </span>
  );
}
