import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionState: PermissionState | null;
}

export function useGeolocation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    permissionState: null,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return null;
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setState(prev => ({ ...prev, permissionState: result.state }));
      return result.state;
    } catch {
      return null;
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Check if component is still mounted before updating state
          if (!isMountedRef.current) {
            resolve(false);
            return;
          }

          const { latitude, longitude } = position.coords;

          setState(prev => ({
            ...prev,
            latitude,
            longitude,
            loading: false,
            permissionState: 'granted',
          }));

          // Save to profile if user is logged in
          if (user?.id) {
            const { error } = await supabase
              .from('profiles')
              .update({
                latitude,
                longitude,
                weather_enabled: true,
              })
              .eq('user_id', user.id);

            // Check mounted before showing toast
            if (!isMountedRef.current) {
              resolve(true);
              return;
            }

            if (error) {
              console.error('Failed to save location:', error);
              toast({
                title: "Location Saved Locally",
                description: "Weather will work for this session, but couldn't save to your profile.",
                variant: "default",
              });
            } else {
              toast({
                title: "Location Detected",
                description: "Weather-aware dashboard is now enabled!",
              });
            }
          }

          resolve(true);
        },
        (error) => {
          // Check if component is still mounted before updating state
          if (!isMountedRef.current) {
            resolve(false);
            return;
          }

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
            permissionState: error.code === error.PERMISSION_DENIED ? 'denied' : prev.permissionState,
          }));

          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });

          resolve(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, [user?.id, toast]);

  const clearLocation = useCallback(async () => {
    setState({
      latitude: null,
      longitude: null,
      loading: false,
      error: null,
      permissionState: null,
    });

    if (user?.id) {
      await supabase
        .from('profiles')
        .update({
          latitude: null,
          longitude: null,
          weather_enabled: false,
        })
        .eq('user_id', user.id);
    }
  }, [user?.id]);

  return {
    ...state,
    requestLocation,
    clearLocation,
    checkPermission,
  };
}
