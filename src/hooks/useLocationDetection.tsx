import { useState, useCallback } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  loading: boolean;
  error: string | null;
}

export function useLocationDetection() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    locationName: null,
    loading: false,
    error: null,
  });

  const detectLocation = useCallback(async (): Promise<{ latitude: number; longitude: number; locationName: string } | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
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
              const state = data.address?.state;
              const country = data.address?.country_code?.toUpperCase();
              locationName = [city, state, country].filter(Boolean).join(', ');
            }
          } catch (err) {
            console.warn('Failed to get location name:', err);
          }

          setState({
            latitude,
            longitude,
            locationName,
            loading: false,
            error: null,
          });

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

          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));

          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
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
