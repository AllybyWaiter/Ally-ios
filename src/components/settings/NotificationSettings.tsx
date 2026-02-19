import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Bell,
  BellOff,
  Clock,
  Moon,
  Send,
  AlertTriangle,
  CheckCircle2,
  Info,
  Volume2,
  VolumeX,
  CloudLightning,
  HeartPulse,
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export default function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isSubscribing,
    preferences,
    loading,
    lastSubscribeCode,
    lastSubscribeError,
    clearSubscribeFailure,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  } = usePushNotifications();
  const [masterEnabled, setMasterEnabled] = useState(false);

  useEffect(() => {
    setMasterEnabled(isSubscribed);
  }, [isSubscribed]);

  const toggleMasterNotifications = async (checked: boolean) => {
    if (isSubscribing) return;
    const previous = masterEnabled;
    setMasterEnabled(checked);

    try {
      const success = checked ? await subscribe() : await unsubscribe();
      if (!success) {
        setMasterEnabled(previous);
      } else {
        clearSubscribeFailure();
      }
    } catch (error) {
      setMasterEnabled(previous);
      logger.error('Failed to toggle push notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in your browser. Try using Chrome, Firefox, or Edge on desktop, or install the app on your home screen on mobile.
        </AlertDescription>
      </Alert>
    );
  }

  const isNativeApp = Capacitor.isNativePlatform();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  const isStandalone = navigatorWithStandalone.standalone === true;
  const isIOSNotPWA = !isNativeApp && isIOS && !isStandalone;

  const openSystemSettings = () => {
    if (!isNativeApp) return;
    try {
      window.location.href = 'app-settings:';
    } catch (error) {
      logger.error('Failed to open system settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {isIOSNotPWA && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            On iOS, push notifications only work when the app is installed to your home screen. Tap the share button and select "Add to Home Screen".
          </AlertDescription>
        </Alert>
      )}

      {permission === 'denied' && (
        <Alert variant="destructive">
          <BellOff className="h-4 w-4" />
          <AlertDescription>
            Notifications are blocked. Please enable them in {isNativeApp ? 'Settings > Notifications' : 'your browser settings'} to receive push notifications.
            {isNativeApp && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={openSystemSettings}>
                  Open iOS Settings
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!!lastSubscribeError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Notification setup failed</div>
            <div className="text-sm mt-1">{lastSubscribeError}</div>
            {!!lastSubscribeCode && (
              <div className="text-xs mt-2 text-muted-foreground">Failure code: {lastSubscribeCode}</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive reminders for upcoming maintenance tasks and water test alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled" className="text-base">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {isSubscribing
                  ? 'Enabling notifications...'
                  : isSubscribed
                    ? 'Notifications are enabled'
                    : 'Enable to receive alerts'}
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={masterEnabled}
              onCheckedChange={toggleMasterNotifications}
              disabled={isSubscribing}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void toggleMasterNotifications(!masterEnabled)}
              disabled={isSubscribing}
            >
              {masterEnabled ? 'Disable Notifications' : 'Enable Notifications'}
            </Button>
          </div>

          {permission === 'denied' && (
            <p className="text-xs text-muted-foreground">
              iOS requires enabling notifications in device Settings for this app.
            </p>
          )}

          {isSubscribed && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await sendTestNotification('task_reminder');
                  } catch (e) {
                    logger.error('Test notification failed:', e);
                  }
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Test Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await sendTestNotification('water_alert');
                  } catch (e) {
                    logger.error('Test notification failed:', e);
                  }
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Test Alert
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await sendTestNotification('announcement');
                  } catch (e) {
                    logger.error('Test notification failed:', e);
                  }
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Test Announcement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn(!isSubscribed && 'opacity-50 pointer-events-none')}>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-reminders" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Task Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Upcoming maintenance tasks and equipment maintenance
                </p>
              </div>
              <Switch
                id="task-reminders"
                checked={preferences.task_reminders_enabled}
                onCheckedChange={async (checked) => {
                  try {
                    await updatePreferences({ task_reminders_enabled: checked });
                  } catch (e) {
                    logger.error('Failed to update preferences:', e);
                  }
                }}
                disabled={!isSubscribed}
              />
            </div>
            {preferences.task_reminders_enabled && (
              <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
                <Label htmlFor="sound-task" className="text-sm flex items-center gap-2">
                  {preferences.sound_task_reminders ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  Sound & vibration
                </Label>
                <Switch
                  id="sound-task"
                  checked={preferences.sound_task_reminders}
                  onCheckedChange={async (checked) => {
                    try {
                      await updatePreferences({ sound_task_reminders: checked });
                    } catch (e) {
                      logger.error('Failed to update preferences:', e);
                    }
                  }}
                  disabled={!isSubscribed}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="water-alerts" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Water Test Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Trend alerts and parameter warnings from water tests
                </p>
              </div>
              <Switch
                id="water-alerts"
                checked={preferences.water_alerts_enabled}
                onCheckedChange={async (checked) => {
                  try {
                    await updatePreferences({ water_alerts_enabled: checked });
                  } catch (e) {
                    logger.error('Failed to update preferences:', e);
                  }
                }}
                disabled={!isSubscribed}
              />
            </div>
            {preferences.water_alerts_enabled && (
              <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
                <Label htmlFor="sound-water" className="text-sm flex items-center gap-2">
                  {preferences.sound_water_alerts ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  Sound & vibration
                </Label>
                <Switch
                  id="sound-water"
                  checked={preferences.sound_water_alerts}
                  onCheckedChange={async (checked) => {
                    try {
                      await updatePreferences({ sound_water_alerts: checked });
                    } catch (e) {
                      logger.error('Failed to update preferences:', e);
                    }
                  }}
                  disabled={!isSubscribed}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="announcements" className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-secondary" />
                  Announcements
                </Label>
                <p className="text-sm text-muted-foreground">
                  Important updates and announcements from Ally
                </p>
              </div>
              <Switch
                id="announcements"
                checked={preferences.announcements_enabled}
                onCheckedChange={async (checked) => {
                  try {
                    await updatePreferences({ announcements_enabled: checked });
                  } catch (e) {
                    logger.error('Failed to update preferences:', e);
                  }
                }}
                disabled={!isSubscribed}
              />
            </div>
            {preferences.announcements_enabled && (
              <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
                <Label htmlFor="sound-announcements" className="text-sm flex items-center gap-2">
                  {preferences.sound_announcements ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  Sound & vibration
                </Label>
                <Switch
                  id="sound-announcements"
                  checked={preferences.sound_announcements}
                  onCheckedChange={async (checked) => {
                    try {
                      await updatePreferences({ sound_announcements: checked });
                    } catch (e) {
                      logger.error('Failed to update preferences:', e);
                    }
                  }}
                  disabled={!isSubscribed}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="health-alerts" className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-rose-500" />
                  Health Score Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when any aquarium's health score drops below 50%
                </p>
              </div>
              <Switch
                id="health-alerts"
                checked={preferences.health_alerts_enabled}
                onCheckedChange={async (checked) => {
                  try {
                    await updatePreferences({ health_alerts_enabled: checked });
                  } catch (e) {
                    logger.error('Failed to update preferences:', e);
                  }
                }}
                disabled={!isSubscribed}
              />
            </div>
            {preferences.health_alerts_enabled && (
              <>
                <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
                  <Label htmlFor="sound-health" className="text-sm flex items-center gap-2">
                    {preferences.sound_health_alerts ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    Sound & vibration
                  </Label>
                  <Switch
                    id="sound-health"
                    checked={preferences.sound_health_alerts}
                    onCheckedChange={async (checked) => {
                      try {
                        await updatePreferences({ sound_health_alerts: checked });
                      } catch (e) {
                        logger.error('Failed to update preferences:', e);
                      }
                    }}
                    disabled={!isSubscribed}
                  />
                </div>
                <div className="pl-6 border-l-2 border-muted">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await sendTestNotification('health_alert');
                      } catch (e) {
                        logger.error('Test notification failed:', e);
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Test Health Alert
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weather-alerts" className="flex items-center gap-2">
                  <CloudLightning className="h-4 w-4 text-red-500" />
                  Severe Weather Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified of extreme or severe weather in your area (US only)
                </p>
              </div>
              <Switch
                id="weather-alerts"
                checked={preferences.weather_alerts_enabled}
                onCheckedChange={async (checked) => {
                  try {
                    await updatePreferences({ weather_alerts_enabled: checked });
                  } catch (e) {
                    logger.error('Failed to update preferences:', e);
                  }
                }}
                disabled={!isSubscribed}
              />
            </div>
            {preferences.weather_alerts_enabled && (
              <>
                <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
                  <Label htmlFor="sound-weather" className="text-sm flex items-center gap-2">
                    {preferences.sound_weather_alerts ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    Sound & vibration
                  </Label>
                  <Switch
                    id="sound-weather"
                    checked={preferences.sound_weather_alerts}
                    onCheckedChange={async (checked) => {
                      try {
                        await updatePreferences({ sound_weather_alerts: checked });
                      } catch (e) {
                        logger.error('Failed to update preferences:', e);
                      }
                    }}
                    disabled={!isSubscribed}
                  />
                </div>
                <div className="pl-6 border-l-2 border-muted">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await sendTestNotification('weather_alert');
                      } catch (e) {
                        logger.error('Test notification failed:', e);
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Test Weather Alert
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={cn(!isSubscribed && 'opacity-50 pointer-events-none')}>
        <CardHeader>
          <CardTitle>Reminder Timing</CardTitle>
          <CardDescription>
            Configure when you receive task reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-hours">Remind me before tasks are due</Label>
            <Select
              value={preferences.reminder_hours_before.toString()}
              onValueChange={async (value) => {
                try {
                  await updatePreferences({ reminder_hours_before: parseInt(value, 10) });
                } catch (e) {
                  logger.error('Failed to update preferences:', e);
                }
              }}
              disabled={!isSubscribed}
            >
              <SelectTrigger id="reminder-hours" className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour before</SelectItem>
                <SelectItem value="6">6 hours before</SelectItem>
                <SelectItem value="12">12 hours before</SelectItem>
                <SelectItem value="24">24 hours before</SelectItem>
                <SelectItem value="48">2 days before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Label>Quiet Hours</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Pause notifications during specific hours (optional)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={preferences.quiet_hours_start || 'none'}
                onValueChange={async (value) => {
                  try {
                    await updatePreferences({ quiet_hours_start: value === 'none' ? null : value });
                  } catch (e) {
                    logger.error('Failed to update preferences:', e);
                  }
                }}
                disabled={!isSubscribed}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="20:00">8:00 PM</SelectItem>
                  <SelectItem value="21:00">9:00 PM</SelectItem>
                  <SelectItem value="22:00">10:00 PM</SelectItem>
                  <SelectItem value="23:00">11:00 PM</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">to</span>
              <Select
                value={preferences.quiet_hours_end || 'none'}
                onValueChange={async (value) => {
                  try {
                    await updatePreferences({ quiet_hours_end: value === 'none' ? null : value });
                  } catch (e) {
                    logger.error('Failed to update preferences:', e);
                  }
                }}
                disabled={!isSubscribed || !preferences.quiet_hours_start}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="07:00">7:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isSubscribed && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Push notifications are active on this device
        </div>
      )}
    </div>
  );
}
