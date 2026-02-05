import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value?: number;
  end?: number; // Alias for value
  duration?: number;
  formatValue?: (value: number) => string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  end,
  duration = 1000,
  formatValue,
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  // Use end as alias for value, with NaN safety
  const targetValue = end ?? value ?? 0;
  const safeTarget = Number.isNaN(targetValue) ? 0 : targetValue;

  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = safeTarget;
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

      const multiplier = Math.pow(10, decimals);
      setDisplayValue(Math.round(currentValue * multiplier) / multiplier);

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
  }, [safeTarget, duration, decimals]);

  // Guard against NaN in display
  const safeDisplayValue = Number.isNaN(displayValue) ? 0 : displayValue;

  const formattedValue = formatValue
    ? formatValue(safeDisplayValue)
    : safeDisplayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

  return (
    <span className={className}>
      {formattedValue}
      {suffix}
    </span>
  );
}
