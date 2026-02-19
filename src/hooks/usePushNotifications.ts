import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import type { PushNotificationsPlugin } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const VAPID_PUBLIC_KEY_ENDPOINT = 'get-vapid-key';

const isNative = Capacitor.isNativePlatform();

const LEGACY_NATIVE_KEY_PLACEHOLDER = 'native-apns';
const LEGACY_APNS_ENDPOINT_PREFIX = 'apns://';

export type SubscribeFailureCode =
  | 'offline'
  | 'not_ready'
  | 'permission_denied'
  | 'registration_failed'
  | 'vapid_missing'
  | 'subscription_create_failed'
  | 'db_write_failed'
  | 'preferences_write_failed'
  | 'unknown';

const mapNativePermission = (receive: string): NotificationPermission => {
  if (receive === 'granted') return 'granted';
  if (receive === 'denied') return 'denied';
  return 'default';
};

const getErrorText = (error: unknown): string => {
  if (!error || typeof error !== 'object') return '';
  const err = error as { message?: string; details?: string; hint?: string; code?: string };
  return [err.message, err.details, err.hint, err.code].filter(Boolean).join(' ').toLowerCase();
};

const isLegacyNativeSchemaError = (error: unknown): boolean => {
  const text = getErrorText(error);
  if (!text) return false;
  return (
    text.includes('platform') ||
    text.includes('device_token') ||
    text.includes('p256dh') ||
    text.includes('push_subscriptions_web_keys_check') ||
    text.includes('push_subscriptions_ios_token_check')
  );
};

const getApnsEndpoint = (token: string) => `${LEGACY_APNS_ENDPOINT_PREFIX}${token}`;

const isLegacyNotificationPreferencesSchemaError = (error: unknown): boolean => {
  const text = getErrorText(error);
  if (!text.includes('notification_preferences')) return false;
  return (
    text.includes('weather_alerts_enabled') ||
    text.includes('health_alerts_enabled') ||
    text.includes('sound_task_reminders') ||
    text.includes('sound_water_alerts') ||
    text.includes('sound_announcements') ||
    text.includes('sound_weather_alerts') ||
    text.includes('sound_health_alerts')
  );
};

const mapFailureCodeFromError = (error: unknown): SubscribeFailureCode => {
  const text = getErrorText(error);

  if (text.includes('permission')) return 'permission_denied';
  if (text.includes('register') || text.includes('token') || text.includes('apns')) return 'registration_failed';
  if (text.includes('vapid')) return 'vapid_missing';
  if (text.includes('subscription') && (text.includes('missing') || text.includes('create'))) {
    return 'subscription_create_failed';
  }
  if (text.includes('push_subscriptions') || text.includes('rls') || text.includes('policy') || text.includes('column')) {
    return 'db_write_failed';
  }
  if (text.includes('notification_preferences')) return 'preferences_write_failed';

  return 'unknown';
};

const removeListenerSafely = async (listener: PluginListenerHandle | null) => {
  if (!listener) return;
  try {
    await listener.remove();
  } catch {
    // Ignore listener cleanup errors.
  }
};

const registerForNativePushToken = async (pushNotifications: PushNotificationsPlugin): Promise<string> => {
  let registrationListener: PluginListenerHandle | null = null;
  let registrationErrorListener: PluginListenerHandle | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let settled = false;

  const cleanup = async () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    await Promise.allSettled([
      removeListenerSafely(registrationListener),
      removeListenerSafely(registrationErrorListener),
    ]);
  };

  return new Promise<string>((resolve, reject) => {
    const resolveOnce = (token: string) => {
      if (settled) return;
      settled = true;
      void cleanup().finally(() => resolve(token));
    };

    const rejectOnce = (error: Error) => {
      if (settled) return;
      settled = true;
      void cleanup().finally(() => reject(error));
    };

    void (async () => {
      try {
        registrationListener = await pushNotifications.addListener('registration', (tokenResult) => {
          resolveOnce(tokenResult.value);
        });

        registrationErrorListener = await pushNotifications.addListener('registrationError', (error) => {
          rejectOnce(new Error(error.error || 'Registration failed'));
        });

        timeoutId = setTimeout(() => {
          rejectOnce(new Error('Registration timed out'));
        }, 15000);

        await pushNotifications.register();
      } catch (error) {
        rejectOnce(error instanceof Error ? error : new Error('Registration failed'));
      }
    })();
  });
};

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

const toLegacyNotificationPreferencesPayload = (userId: string, prefs: NotificationPreferences) => ({
  user_id: userId,
  push_enabled: prefs.push_enabled,
  task_reminders_enabled: prefs.task_reminders_enabled,
  water_alerts_enabled: prefs.water_alerts_enabled,
  announcements_enabled: prefs.announcements_enabled,
  reminder_hours_before: prefs.reminder_hours_before,
  quiet_hours_start: prefs.quiet_hours_start,
  quiet_hours_end: prefs.quiet_hours_end,
});

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
  const [lastSubscribeError, setLastSubscribeError] = useState<string | null>(null);
  const [lastSubscribeCode, setLastSubscribeCode] = useState<SubscribeFailureCode | null>(null);
  const nativeListenersRef = useRef<(() => void)[]>([]);

  const clearSubscribeFailure = useCallback(() => {
    setLastSubscribeError(null);
    setLastSubscribeCode(null);
  }, []);

  const recordSubscribeFailure = useCallback((code: SubscribeFailureCode, message: string) => {
    setLastSubscribeCode(code);
    setLastSubscribeError(message);
    logger.error('[Push] subscribe failed', { code, message });
  }, []);

  const refreshPermission = useCallback(async () => {
    if (isNative) {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { receive } = await PushNotifications.checkPermissions();
        setPermission(mapNativePermission(receive));
      } catch (error) {
        logger.error('Failed to check native notification permission:', error);
      }
      return;
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (isNative) {
      setIsSupported(true);
      void refreshPermission();
    } else {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      setIsSupported(supported);
      if (supported) {
        void refreshPermission();
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshPermission();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshPermission]);

  useEffect(() => {
    if (isNative) return;

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

    void fetchVapidKey();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
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

        if (isNative) {
          const { data: subs, error: subError } = await supabase
            .from('push_subscriptions')
            .select('endpoint')
            .eq('user_id', user.id)
            .eq('platform', 'ios');

          if (!isMounted) return;

          if (!subError) {
            setIsSubscribed(!!subs && subs.length > 0);
          } else if (isLegacyNativeSchemaError(subError)) {
            const { data: legacySubs, error: legacyError } = await supabase
              .from('push_subscriptions')
              .select('endpoint')
              .eq('user_id', user.id)
              .like('endpoint', `${LEGACY_APNS_ENDPOINT_PREFIX}%`);

            if (!isMounted) return;
            setIsSubscribed(!legacyError && !!legacySubs && legacySubs.length > 0);
          } else {
            setIsSubscribed(false);
          }
        } else {
          const { data: subs, error: subError } = await supabase
            .from('push_subscriptions')
            .select('endpoint')
            .eq('user_id', user.id);

          if (!isMounted) return;

          const hasDbSubscription = !subError && subs && subs.length > 0;

          if (hasDbSubscription && 'serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.ready;
              const browserSubscription = await registration.pushManager.getSubscription();

              if (!isMounted) return;

              if (browserSubscription) {
                const browserEndpoint = browserSubscription.endpoint;
                const endpointMatch = subs.some(s => s.endpoint === browserEndpoint);

                if (!endpointMatch) {
                  logger.warn('Push subscription mismatch detected');
                  setSubscriptionMismatch(true);
                }
                setIsSubscribed(true);
              } else {
                setIsSubscribed(false);
                setSubscriptionMismatch(true);
              }
            } catch {
              if (isMounted) setIsSubscribed(hasDbSubscription);
            }
          } else {
            setIsSubscribed(hasDbSubscription);
          }
        }
      } catch (error) {
        logger.error('Error loading notification data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isNative || !isSubscribed) return;

    let cleanedUp = false;

    async function setupListeners() {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      const receivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        logger.log('Native push received in foreground:', notification.title);
      });

      const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification.data;
        if (data?.url) {
          window.location.href = data.url;
        }
      });

      if (!cleanedUp) {
        nativeListenersRef.current = [
          () => receivedListener.remove(),
          () => actionListener.remove(),
        ];
      } else {
        receivedListener.remove();
        actionListener.remove();
      }
    }

    void setupListeners();

    return () => {
      cleanedUp = true;
      nativeListenersRef.current.forEach(cleanup => cleanup());
      nativeListenersRef.current = [];
    };
  }, [isSubscribed]);

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

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      const currentPrefs = await new Promise<NotificationPreferences>(resolve => {
        setPreferences(prev => {
          resolve(prev);
          return prev;
        });
      });
      const newPrefs = { ...currentPrefs, ...updates };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: user.id,
            ...newPrefs,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        if (isLegacyNotificationPreferencesSchemaError(error)) {
          const { error: legacyError } = await supabase
            .from('notification_preferences')
            .upsert(toLegacyNotificationPreferencesPayload(user.id, newPrefs), {
              onConflict: 'user_id',
            });

          if (legacyError) throw legacyError;
        } else {
          throw error;
        }
      }

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
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!navigator.onLine) {
      recordSubscribeFailure('offline', 'Device is offline.');
      toast({
        title: 'You are offline',
        description: 'Please connect to the internet to enable notifications.',
        variant: 'destructive',
      });
      return false;
    }

    if (!user || !isSupported) {
      recordSubscribeFailure('not_ready', 'Push notifications are not supported or user context is unavailable.');
      toast({
        title: 'Cannot subscribe',
        description: 'Push notifications are not supported or not ready.',
        variant: 'destructive',
      });
      return false;
    }

    setIsSubscribing(true);

    try {
      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive === 'denied') {
          setPermission('denied');
          recordSubscribeFailure('permission_denied', 'User denied native notification permissions.');
          toast({
            title: 'Permission denied',
            description: 'Please enable notifications in Settings > Notifications.',
            variant: 'destructive',
          });
          setIsSubscribing(false);
          return false;
        }

        setPermission(mapNativePermission(permResult.receive));

        const token = await registerForNativePushToken(PushNotifications);
        logger.log('APNs device token received:', token.slice(0, 8) + '...');

        const syntheticEndpoint = getApnsEndpoint(token);
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert(
            {
              user_id: user.id,
              endpoint: syntheticEndpoint,
              platform: 'ios',
              device_token: token,
              p256dh: null,
              auth: null,
              user_agent: navigator.userAgent,
            },
            {
              onConflict: 'user_id,endpoint',
            }
          );

        if (error) {
          if (isLegacyNativeSchemaError(error)) {
            const { error: legacyError } = await supabase
              .from('push_subscriptions')
              .upsert(
                {
                  user_id: user.id,
                  endpoint: syntheticEndpoint,
                  p256dh: LEGACY_NATIVE_KEY_PLACEHOLDER,
                  auth: LEGACY_NATIVE_KEY_PLACEHOLDER,
                  user_agent: navigator.userAgent,
                },
                {
                  onConflict: 'user_id,endpoint',
                }
              );

            if (legacyError) throw legacyError;
          } else {
            throw error;
          }
        }

        const prefOk = await updatePreferences({ push_enabled: true });
        if (!prefOk) {
          recordSubscribeFailure('preferences_write_failed', 'Subscription saved but notification preferences update failed.');
          return false;
        }

        setIsSubscribed(true);
        setSubscriptionMismatch(false);
        clearSubscribeFailure();
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive push notifications.',
        });
        return true;
      }

      if (!vapidPublicKey) {
        recordSubscribeFailure('vapid_missing', vapidError || 'VAPID public key is unavailable.');
        toast({
          title: 'Cannot subscribe',
          description: vapidError || 'Push notifications are not ready.',
          variant: 'destructive',
        });
        setIsSubscribing(false);
        return false;
      }

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        recordSubscribeFailure('permission_denied', 'User denied browser notification permissions.');
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        setIsSubscribing(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      let subscription = existingSubscription;

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

      if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
        throw new Error('Push subscription is missing required fields');
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            endpoint: subscriptionJson.endpoint,
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth,
            platform: 'web',
            user_agent: navigator.userAgent,
          },
          {
            onConflict: 'user_id,endpoint',
          }
        );

      if (error) throw error;

      const prefOk = await updatePreferences({ push_enabled: true });
      if (!prefOk) {
        recordSubscribeFailure('preferences_write_failed', 'Subscription saved but notification preferences update failed.');
        return false;
      }

      setIsSubscribed(true);
      setSubscriptionMismatch(false);
      clearSubscribeFailure();
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications.',
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      const code = mapFailureCodeFromError(error);
      recordSubscribeFailure(code, message);
      logger.error('Failed to subscribe:', error);
      toast({
        title: 'Failed to enable notifications',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [
    clearSubscribeFailure,
    isSupported,
    recordSubscribeFailure,
    updatePreferences,
    urlBase64ToUint8Array,
    user,
    vapidError,
    vapidPublicKey,
  ]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.removeAllListeners();
        nativeListenersRef.current = [];

        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('platform', 'ios');

        if (error) {
          if (isLegacyNativeSchemaError(error)) {
            const { error: legacyError } = await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user.id)
              .like('endpoint', `${LEGACY_APNS_ENDPOINT_PREFIX}%`);
            if (legacyError) throw legacyError;
          } else {
            throw error;
          }
        }
      } else {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }

        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      }

      await updatePreferences({ push_enabled: false });
      setIsSubscribed(false);
      setSubscriptionMismatch(false);
      clearSubscribeFailure();
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
  }, [clearSubscribeFailure, updatePreferences, user]);

  const retryVapidFetch = useCallback(async () => {
    if (isNative) return;
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

  const sendTestNotification = useCallback(
    async (
      notificationType: 'task_reminder' | 'water_alert' | 'announcement' | 'weather_alert' | 'health_alert' = 'task_reminder'
    ) => {
      if (!user || !isSubscribed) return false;

      const testMessages = {
        task_reminder: { title: 'Task Reminder', body: 'This is how task reminders feel! 📋' },
        water_alert: { title: 'Water Alert', body: 'This is how water alerts feel! 💧' },
        announcement: { title: 'Announcement', body: 'This is how announcements feel! 📢' },
        weather_alert: { title: '⛈️ Severe Weather Alert', body: 'This is how severe weather alerts feel! 🌪️' },
        health_alert: { title: '⚠️ Health Score Alert', body: 'This is how health score alerts feel! 📊' },
      };

      const message = testMessages[notificationType];
      const testReferenceId = `test-${notificationType}-${Date.now()}`;

      try {
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
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
        if (!data?.sent) {
          const reason = typeof data?.reason === 'string' ? data.reason.replace(/_/g, ' ') : 'delivery failed';
          throw new Error(`Test notification was not delivered (${reason}).`);
        }

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
    },
    [isSubscribed, user]
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isSubscribing,
    preferences,
    loading,
    vapidError,
    subscriptionMismatch,
    lastSubscribeCode,
    lastSubscribeError,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    retryVapidFetch,
    clearSubscribeFailure,
  };
}
