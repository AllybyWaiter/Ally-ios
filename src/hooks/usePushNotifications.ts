import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// VAPID public key - loaded from edge function
const VAPID_PUBLIC_KEY_ENDPOINT = 'get-vapid-key';

interface NotificationPreferences {
  push_enabled: boolean;
  task_reminders_enabled: boolean;
  water_alerts_enabled: boolean;
  announcements_enabled: boolean;
  weather_alerts_enabled: boolean;
  health_alerts_enabled: boolean;
  reminder_hours_before: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  sound_task_reminders: boolean;
  sound_water_alerts: boolean;
  sound_announcements: boolean;
  sound_weather_alerts: boolean;
  sound_health_alerts: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: false,
  task_reminders_enabled: true,
  water_alerts_enabled: true,
  announcements_enabled: true,
  weather_alerts_enabled: false,
  health_alerts_enabled: true,
  reminder_hours_before: 24,
  quiet_hours_start: null,
  quiet_hours_end: null,
  sound_task_reminders: true,
  sound_water_alerts: true,
  sound_announcements: true,
  sound_weather_alerts: true,
  sound_health_alerts: true,
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [vapidError, setVapidError] = useState<string | null>(null);
  const [subscriptionMismatch, setSubscriptionMismatch] = useState(false);

  // Check browser support
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch VAPID public key with error handling and abort signal
  useEffect(() => {
    let isMounted = true;

    async function fetchVapidKey() {
      try {
        const { data, error } = await supabase.functions.invoke(VAPID_PUBLIC_KEY_ENDPOINT);
        if (!isMounted) return;
        if (error) throw error;
        if (!data?.publicKey) {
          throw new Error('VAPID key not returned');
        }
        setVapidPublicKey(data.publicKey);
        setVapidError(null);
      } catch (error) {
        if (!isMounted) return;
        logger.error('Failed to fetch VAPID key:', error);
        setVapidError(error instanceof Error ? error.message : 'Failed to load notification settings');
      }
    }
    fetchVapidKey();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load user preferences and subscription status with browser validation
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        // Load preferences
        const { data: prefs, error: prefsError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (prefsError) {
          logger.error('Failed to load notification preferences:', prefsError);
        }

        if (!isMounted) return;

        if (prefs) {
          setPreferences({
            push_enabled: prefs.push_enabled,
            task_reminders_enabled: prefs.task_reminders_enabled,
            water_alerts_enabled: prefs.water_alerts_enabled,
            announcements_enabled: prefs.announcements_enabled,
            weather_alerts_enabled: prefs.weather_alerts_enabled ?? false,
            health_alerts_enabled: prefs.health_alerts_enabled ?? true,
            reminder_hours_before: prefs.reminder_hours_before,
            quiet_hours_start: prefs.quiet_hours_start,
            quiet_hours_end: prefs.quiet_hours_end,
            sound_task_reminders: prefs.sound_task_reminders ?? true,
            sound_water_alerts: prefs.sound_water_alerts ?? true,
            sound_announcements: prefs.sound_announcements ?? true,
            sound_weather_alerts: prefs.sound_weather_alerts ?? true,
            sound_health_alerts: prefs.sound_health_alerts ?? true,
          });
        }

        // Check if subscribed in database
        const { data: subs, error: subError } = await supabase
          .from('push_subscriptions')
          .select('endpoint')
          .eq('user_id', user.id);

        if (!isMounted) return;

        const hasDbSubscription = !subError && subs && subs.length > 0;

        // Validate against browser subscription
        if (hasDbSubscription && 'serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const browserSubscription = await registration.pushManager.getSubscription();

            if (!isMounted) return;

            if (browserSubscription) {
              // Check if browser endpoint matches any DB endpoint
              const browserEndpoint = browserSubscription.endpoint;
              const endpointMatch = subs.some(s => s.endpoint === browserEndpoint);

              if (!endpointMatch) {
                // Browser has a subscription but it doesn't match DB - subscription mismatch
                logger.warn('Push subscription mismatch detected');
                setSubscriptionMismatch(true);
              }
              setIsSubscribed(true);
            } else {
              // DB says subscribed but browser has no subscription - stale data
              setIsSubscribed(false);
              setSubscriptionMismatch(true);
            }
          } catch {
            // Service worker not ready, trust DB
            if (isMounted) setIsSubscribed(hasDbSubscription);
          }
        } else {
          setIsSubscribed(hasDbSubscription);
        }
      } catch (error) {
        logger.error('Error loading notification data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Convert URL-safe base64 to Uint8Array for VAPID key
  const urlBase64ToUint8Array = useCallback((base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    // Check online status before attempting to subscribe
    if (!navigator.onLine) {
      toast({
        title: 'You are offline',
        description: 'Please connect to the internet to enable notifications.',
        variant: 'destructive',
      });
      return false;
    }

    if (!user || !isSupported || !vapidPublicKey) {
      toast({
        title: 'Cannot subscribe',
        description: vapidError || 'Push notifications are not supported or not ready.',
        variant: 'destructive',
      });
      return false;
    }

    setIsSubscribing(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        setIsSubscribing(false);
        return false;
      }

      // Use the main PWA service worker (already registered by VitePWA)
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription first to avoid duplicates
      const existingSubscription = await registration.pushManager.getSubscription();
      
      let subscription = existingSubscription;
      
      // Only create new subscription if none exists or keys don't match
      if (!existingSubscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      if (!subscription) {
        throw new Error('Failed to create push subscription');
      }

      const subscriptionJson = subscription.toJSON();

      // Validate subscription fields before saving
      if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
        throw new Error('Push subscription is missing required fields');
      }

      // Save subscription to database (upsert to handle existing subscriptions)
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
          user_agent: navigator.userAgent,
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      // Enable push in preferences
      await updatePreferences({ push_enabled: true });

      setIsSubscribed(true);
      setSubscriptionMismatch(false);
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications.',
      });

      return true;
    } catch (error) {
      logger.error('Failed to subscribe:', error);
      toast({
        title: 'Failed to enable notifications',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [user, isSupported, vapidPublicKey, vapidError, urlBase64ToUint8Array]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      // Get service worker registration using navigator.serviceWorker.ready
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Remove from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Disable push in preferences
      await updatePreferences({ push_enabled: false });

      setIsSubscribed(false);
      setSubscriptionMismatch(false);
      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications.',
      });

      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe:', error);
      toast({
        title: 'Failed to disable notifications',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user]);

  // Update notification preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      // Use functional update to read latest preferences, avoiding stale closure on rapid calls
      const currentPrefs = await new Promise<NotificationPreferences>(resolve => {
        setPreferences(prev => { resolve(prev); return prev; });
      });
      const newPrefs = { ...currentPrefs, ...updates };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPrefs,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setPreferences(newPrefs);
      return true;
    } catch (error) {
      logger.error('Failed to update preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, preferences]);

  // Retry fetching VAPID key
  const retryVapidFetch = useCallback(async () => {
    setVapidError(null);
    try {
      const { data, error } = await supabase.functions.invoke(VAPID_PUBLIC_KEY_ENDPOINT);
      if (error) throw error;
      if (!data?.publicKey) {
        throw new Error('VAPID key not returned');
      }
      setVapidPublicKey(data.publicKey);
    } catch (error) {
      logger.error('Failed to fetch VAPID key:', error);
      setVapidError(error instanceof Error ? error.message : 'Failed to load notification settings');
    }
  }, []);

  // Send a test notification with specific type and unique referenceId
  const sendTestNotification = useCallback(async (notificationType: 'task_reminder' | 'water_alert' | 'announcement' | 'weather_alert' | 'health_alert' = 'task_reminder') => {
    if (!user || !isSubscribed) return false;

    const testMessages = {
      task_reminder: { title: 'Task Reminder', body: 'This is how task reminders feel! 📋' },
      water_alert: { title: 'Water Alert', body: 'This is how water alerts feel! 💧' },
      announcement: { title: 'Announcement', body: 'This is how announcements feel! 📢' },
      weather_alert: { title: '⛈️ Severe Weather Alert', body: 'This is how severe weather alerts feel! 🌪️' },
      health_alert: { title: '⚠️ Health Score Alert', body: 'This is how health score alerts feel! 📊' },
    };

    const message = testMessages[notificationType];
    // Use unique referenceId for test notifications to prevent deduplication issues
    const testReferenceId = `test-${notificationType}-${Date.now()}`;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: message.title,
          body: message.body,
          tag: `test-${notificationType}-${Date.now()}`,
          url: '/settings',
          notificationType,
          referenceId: testReferenceId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Test sent',
        description: `Check for the ${notificationType.replace('_', ' ')} notification!`,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send test notification:', error);
      toast({
        title: 'Failed to send test',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, isSubscribed]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isSubscribing,
    preferences,
    loading,
    vapidError,
    subscriptionMismatch,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    retryVapidFetch,
  };
}
