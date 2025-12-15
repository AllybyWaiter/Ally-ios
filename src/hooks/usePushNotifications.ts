import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// VAPID public key - loaded from edge function
const VAPID_PUBLIC_KEY_ENDPOINT = 'get-vapid-key';

interface NotificationPreferences {
  push_enabled: boolean;
  task_reminders_enabled: boolean;
  water_alerts_enabled: boolean;
  announcements_enabled: boolean;
  reminder_hours_before: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: false,
  task_reminders_enabled: true,
  water_alerts_enabled: true,
  announcements_enabled: true,
  reminder_hours_before: 24,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

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

  // Fetch VAPID public key
  useEffect(() => {
    async function fetchVapidKey() {
      try {
        const { data, error } = await supabase.functions.invoke(VAPID_PUBLIC_KEY_ENDPOINT);
        if (error) throw error;
        setVapidPublicKey(data?.publicKey);
      } catch (error) {
        console.error('Failed to fetch VAPID key:', error);
      }
    }
    fetchVapidKey();
  }, []);

  // Load user preferences and subscription status
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        // Load preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (prefs) {
          setPreferences({
            push_enabled: prefs.push_enabled,
            task_reminders_enabled: prefs.task_reminders_enabled,
            water_alerts_enabled: prefs.water_alerts_enabled,
            announcements_enabled: prefs.announcements_enabled,
            reminder_hours_before: prefs.reminder_hours_before,
            quiet_hours_start: prefs.quiet_hours_start,
            quiet_hours_end: prefs.quiet_hours_end,
          });
        }

        // Check if subscribed
        const { data: subs, error: subError } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id);

        if (!subError && subs && subs.length > 0) {
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Error loading notification data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
    if (!user || !isSupported || !vapidPublicKey) {
      toast({
        title: 'Cannot subscribe',
        description: 'Push notifications are not supported or not ready.',
        variant: 'destructive',
      });
      return false;
    }

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
        return false;
      }

      // Use the main PWA service worker (already registered by VitePWA)
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
          user_agent: navigator.userAgent,
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      // Enable push in preferences
      await updatePreferences({ push_enabled: true });

      setIsSubscribed(true);
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications.',
      });

      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast({
        title: 'Failed to enable notifications',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, isSupported, vapidPublicKey, urlBase64ToUint8Array]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration('/');
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
      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications.',
      });

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
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
      const newPrefs = { ...preferences, ...updates };

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
      console.error('Failed to update preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, preferences]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (!user || !isSubscribed) return false;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: 'Test Notification',
          body: 'Push notifications are working correctly!',
          tag: 'test-notification',
          url: '/settings',
        },
      });

      if (error) throw error;

      toast({
        title: 'Test sent',
        description: 'Check for the push notification!',
      });

      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
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
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  };
}
