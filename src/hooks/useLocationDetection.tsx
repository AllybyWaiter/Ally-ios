import { useState, useCallback, useRef, useEffect } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  loading: boolean;
  error: string | null;
}

// Debounce delay in ms
const DEBOUNCE_DELAY = 1000;

export function useLocationDetection() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    locationName: null,
    loading: false,
    error: null,
  });

  // Debounce ref to prevent multiple rapid calls
  const lastCallRef = useRef<number>(0);
  const pendingPromiseRef = useRef<Promise<{ latitude: number; longitude: number; locationName: string } | null> | null>(null);
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const detectLocation = useCallback(async (): Promise<{ latitude: number; longitude: number; locationName: string } | null> => {
    // Debounce: if called within DEBOUNCE_DELAY, return existing pending promise or null
    const now = Date.now();
    if (now - lastCallRef.current < DEBOUNCE_DELAY) {
      if (pendingPromiseRef.current) {
        return pendingPromiseRef.current;
      }
      return null;
    }
    lastCallRef.current = now;
    if (!navigator.geolocation) {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      }
      return null;
    }

    if (isMountedRef.current) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    const promise = new Promise<{ latitude: number; longitude: number; locationName: string } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Get location name via reverse geocoding
          let locationName = 'Unknown Location';
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            if (response.ok) {
              const data = await response.json();
              const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
              const stateValue = data.address?.state;
              const country = data.address?.country_code?.toUpperCase();
              locationName = [city, stateValue, country].filter(Boolean).join(', ');
            }
          } catch (err) {
            console.warn('Failed to get location name:', err);
          }

          if (isMountedRef.current) {
            setState({
              latitude,
              longitude,
              locationName,
              loading: false,
              error: null,
            });
          }

          resolve({ latitude, longitude, locationName });
        },
        (error) => {
          let errorMessage = 'Failed to get location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission was denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
          }

          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });

    pendingPromiseRef.current = promise;
    const result = await promise;
    pendingPromiseRef.current = null;
    return result;
  }, []);

  const clearDetectedLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      locationName: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    detectLocation,
    clearDetectedLocation,
  };
}
