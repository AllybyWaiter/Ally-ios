import { useState, useEffect } from 'react';

type TimeSlot = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';

interface TimeOfDayInfo {
  slot: TimeSlot;
  imagePath: string;
  greeting: string;
}

const TIME_SLOTS: Record<TimeSlot, { start: number; end: number; greeting: string }> = {
  'dawn': { start: 5, end: 8, greeting: 'Good morning' },
  'morning': { start: 8, end: 12, greeting: 'Good morning' },
  'afternoon': { start: 12, end: 17, greeting: 'Good afternoon' },
  'evening': { start: 17, end: 20, greeting: 'Good evening' },
  'night': { start: 20, end: 23, greeting: 'Good evening' },
  'late-night': { start: 23, end: 5, greeting: 'Burning the midnight oil?' },
};

function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late-night';
}

export function useTimeOfDay(): TimeOfDayInfo {
  const [timeInfo, setTimeInfo] = useState<TimeOfDayInfo>(() => {
    const hour = new Date().getHours();
    const slot = getTimeSlot(hour);
    return {
      slot,
      imagePath: `/images/dashboard/${slot}.jpg`,
      greeting: TIME_SLOTS[slot].greeting,
    };
  });

  useEffect(() => {
    // Check every minute for time slot changes
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const slot = getTimeSlot(hour);
      
      setTimeInfo(prev => {
        if (prev.slot !== slot) {
          return {
            slot,
            imagePath: `/images/dashboard/${slot}.jpg`,
            greeting: TIME_SLOTS[slot].greeting,
          };
        }
        return prev;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return timeInfo;
}
