import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Ruler, Moon, Sun, Monitor, Languages, MapPin, Bell, Check, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { PlanSelectionStep } from '@/components/onboarding/PlanSelectionStep';

interface PreferencesOnboardingProps {
  userId: string;
  onComplete: () => void;
}

export function PreferencesOnboarding({ userId, onComplete }: PreferencesOnboardingProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const { refreshProfile } = useAuth();

  // Preferences state
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>('imperial');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [languagePreference, setLanguagePreference] = useState<'en' | 'es' | 'fr'>('en');
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const totalSteps = 6;

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleEnableWeather = async () => {
    if (!navigator.geolocation) {
      toast({
        title: t('preferencesOnboarding.step4.notSupported'),
        variant: 'destructive',
      });
      handleNext();
      return;
    }

    setPermissionLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Update profile with weather enabled and location
          await supabase
            .from('profiles')
            .update({ 
              weather_enabled: true,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
            .eq('user_id', userId);

          setWeatherEnabled(true);
          toast({
            title: t('preferencesOnboarding.step4.enabled'),
          });
        } catch (error) {
          console.error('Failed to save weather settings:', error);
        }
        setPermissionLoading(false);
        handleNext();
      },
      () => {
        // Permission denied
        setPermissionLoading(false);
        toast({
          title: t('preferencesOnboarding.step4.permissionDenied'),
          description: t('preferencesOnboarding.step4.enableLater'),
        });
        handleNext();
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast({
        title: t('preferencesOnboarding.step5.notSupported'),
        variant: 'destructive',
      });
      handleSubmit();
      return;
    }

    setPermissionLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // Get VAPID key and subscribe
        const { data: vapidData } = await supabase.functions.invoke('get-vapid-key');
        
        if (vapidData?.publicKey) {
          const registration = await navigator.serviceWorker.ready;
          const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
          });
          const subscriptionJson = subscription.toJSON();
          
          // Save subscription
          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: subscriptionJson.endpoint!,
            p256dh: subscriptionJson.keys!.p256dh,
            auth: subscriptionJson.keys!.auth,
            user_agent: navigator.userAgent,
          }, { onConflict: 'user_id,endpoint' });

          // Save notification preferences
          await supabase.from('notification_preferences').upsert({
            user_id: userId,
            push_enabled: true,
            task_reminders_enabled: true,
            water_alerts_enabled: true,
            announcements_enabled: true,
          }, { onConflict: 'user_id' });

          setNotificationsEnabled(true);
          toast({
            title: t('preferencesOnboarding.step5.enabled'),
          });
        }
      } else {
        toast({
          title: t('preferencesOnboarding.step5.permissionDenied'),
          description: t('preferencesOnboarding.step5.enableLater'),
        });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: t('preferencesOnboarding.step5.permissionDenied'),
        description: t('preferencesOnboarding.step5.enableLater'),
      });
    }

    setPermissionLoading(false);
    handleSubmit();
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Update profile with preferences AND mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          unit_preference: unitPreference,
          theme_preference: themePreference,
          language_preference: languagePreference,
          onboarding_completed: true,
        })
        .eq('user_id', userId);

      if (profileError) {
        throw profileError;
      }

      // Apply preferences immediately
      setTheme(themePreference);
      i18n.changeLanguage(languagePreference);

      // CRITICAL: Refresh the auth profile to update onboarding_completed in context
      await refreshProfile();
      
      // Extra safety: Small delay to ensure state propagates
      await new Promise(resolve => setTimeout(resolve, 100));

      toast({
        title: t('preferencesOnboarding.success'),
        description: t('preferencesOnboarding.successDescription'),
      });

      onComplete();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('settings.saveError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[100dvh] flex items-start md:items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-28 md:pb-4 overflow-y-auto"
      data-onboarding="true"
    >
      <Card className="w-full max-w-2xl my-auto">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <img src={logo} alt="Ally Logo" className="w-12 h-12 object-contain" />
            <div className="text-center">
              <div className="font-bold text-2xl">{t('preferencesOnboarding.welcome')}</div>
              <div className="text-xs text-muted-foreground">{t('preferencesOnboarding.subtitle')}</div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    i <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i}
                </div>
                {i < totalSteps && (
                  <div
                    className={`w-4 sm:w-6 h-1 mx-0.5 transition-colors ${
                      i < step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Units */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Ruler className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">{t('preferencesOnboarding.step1.title')}</CardTitle>
                <CardDescription>{t('preferencesOnboarding.step1.description')}</CardDescription>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setUnitPreference('imperial')}
                  className={`p-6 rounded-lg border-2 transition-all text-left cursor-pointer touch-manipulation ${
                    unitPreference === 'imperial'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 active:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">{t('preferencesOnboarding.step1.imperial')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step1.imperialDescription')}
                  </div>
                </button>
                
                <button
                  onClick={() => setUnitPreference('metric')}
                  className={`p-6 rounded-lg border-2 transition-all text-left cursor-pointer touch-manipulation ${
                    unitPreference === 'metric'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 active:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">{t('preferencesOnboarding.step1.metric')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step1.metricDescription')}
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} disabled={isLoading} className="touch-manipulation min-h-[44px] min-w-[88px]">
                  {t('preferencesOnboarding.next')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Theme */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Monitor className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">{t('preferencesOnboarding.step2.title')}</CardTitle>
                <CardDescription>{t('preferencesOnboarding.step2.description')}</CardDescription>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setThemePreference('light')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    themePreference === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Sun className="w-5 h-5" />
                    <div className="font-semibold text-lg">{t('preferencesOnboarding.step2.light')}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step2.lightDescription')}
                  </div>
                </button>
                
                <button
                  onClick={() => setThemePreference('dark')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    themePreference === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Moon className="w-5 h-5" />
                    <div className="font-semibold text-lg">{t('preferencesOnboarding.step2.dark')}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step2.darkDescription')}
                  </div>
                </button>

                <button
                  onClick={() => setThemePreference('system')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    themePreference === 'system'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor className="w-5 h-5" />
                    <div className="font-semibold text-lg">{t('preferencesOnboarding.step2.system')}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step2.systemDescription')}
                  </div>
                </button>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(1)} variant="outline" disabled={isLoading}>
                  {t('preferencesOnboarding.back')}
                </Button>
                <Button onClick={handleNext} disabled={isLoading}>
                  {t('preferencesOnboarding.next')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Language */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Languages className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">{t('preferencesOnboarding.step3.title')}</CardTitle>
                <CardDescription>{t('preferencesOnboarding.step3.description')}</CardDescription>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setLanguagePreference('en')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    languagePreference === 'en'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">English</div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step3.englishDescription')}
                  </div>
                </button>
                
                <button
                  onClick={() => setLanguagePreference('es')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    languagePreference === 'es'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">Español</div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step3.spanishDescription')}
                  </div>
                </button>

                <button
                  onClick={() => setLanguagePreference('fr')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    languagePreference === 'fr'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">Français</div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferencesOnboarding.step3.frenchDescription')}
                  </div>
                </button>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(2)} variant="outline" disabled={isLoading}>
                  {t('preferencesOnboarding.back')}
                </Button>
                <Button onClick={handleNext} disabled={isLoading}>
                  {t('preferencesOnboarding.next')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Location & Weather */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <MapPin className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">{t('preferencesOnboarding.step4.title')}</CardTitle>
                <CardDescription>{t('preferencesOnboarding.step4.description')}</CardDescription>
              </div>

              {weatherEnabled ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-muted-foreground">{t('preferencesOnboarding.step4.enabled')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  <button
                    onClick={handleEnableWeather}
                    disabled={permissionLoading}
                    className="p-6 rounded-lg border-2 border-primary bg-primary/5 transition-all text-left cursor-pointer touch-manipulation hover:bg-primary/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {permissionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <MapPin className="w-5 h-5" />
                      )}
                      <div className="font-semibold text-lg">
                        {permissionLoading ? t('common.loading') : t('preferencesOnboarding.step4.enableButton')}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('preferencesOnboarding.step4.enableDescription')}
                    </div>
                  </button>
                  
                  <button
                    onClick={handleNext}
                    disabled={permissionLoading}
                    className="p-6 rounded-lg border-2 border-border transition-all text-left cursor-pointer touch-manipulation hover:border-primary/50"
                  >
                    <div className="font-semibold text-lg mb-2">{t('preferencesOnboarding.step4.skipButton')}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('preferencesOnboarding.step4.skipDescription')}
                    </div>
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(3)} variant="outline" disabled={permissionLoading}>
                  {t('preferencesOnboarding.back')}
                </Button>
                {weatherEnabled && (
                  <Button onClick={handleNext}>
                    {t('preferencesOnboarding.next')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Push Notifications */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Bell className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">{t('preferencesOnboarding.step5.title')}</CardTitle>
                <CardDescription>{t('preferencesOnboarding.step5.description')}</CardDescription>
              </div>

              {notificationsEnabled ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-muted-foreground">{t('preferencesOnboarding.step5.enabled')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  <button
                    onClick={handleEnableNotifications}
                    disabled={permissionLoading || isLoading}
                    className="p-6 rounded-lg border-2 border-primary bg-primary/5 transition-all text-left cursor-pointer touch-manipulation hover:bg-primary/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {permissionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                      <div className="font-semibold text-lg">
                        {permissionLoading ? t('common.loading') : t('preferencesOnboarding.step5.enableButton')}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('preferencesOnboarding.step5.enableDescription')}
                    </div>
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={permissionLoading || isLoading}
                    className="p-6 rounded-lg border-2 border-border transition-all text-left cursor-pointer touch-manipulation hover:border-primary/50"
                  >
                    <div className="font-semibold text-lg mb-2">{t('preferencesOnboarding.step5.skipButton')}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('preferencesOnboarding.step5.skipDescription')}
                    </div>
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(4)} variant="outline" disabled={permissionLoading || isLoading}>
                  {t('preferencesOnboarding.back')}
                </Button>
                {notificationsEnabled && (
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('preferencesOnboarding.saving')}
                      </>
                    ) : (
                      t('preferencesOnboarding.complete')
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
