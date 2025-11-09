import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, Thermometer, Languages, Ruler, Moon, Sun, Monitor } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

interface PreferencesOnboardingProps {
  userId: string;
  onComplete: () => void;
}

export function PreferencesOnboarding({ userId, onComplete }: PreferencesOnboardingProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();

  // Preferences state
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>('imperial');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [languagePreference, setLanguagePreference] = useState<'en' | 'es' | 'fr'>('en');

  const totalSteps = 3;

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Update profile with preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          unit_preference: unitPreference,
          theme_preference: themePreference,
          language_preference: languagePreference,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Apply preferences immediately
      setTheme(themePreference);
      i18n.changeLanguage(languagePreference);

      toast({
        title: 'Preferences saved!',
        description: 'Your preferences have been configured successfully.',
      });

      onComplete();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <img src={logo} alt="Ally Logo" className="w-12 h-12 object-contain" />
            <div className="text-center">
              <div className="font-bold text-2xl">Welcome to Ally</div>
              <div className="text-xs text-muted-foreground">Let's personalize your experience</div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i}
                </div>
                {i < totalSteps && (
                  <div
                    className={`w-12 h-1 mx-2 transition-colors ${
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
                <CardTitle className="text-2xl">Choose Your Units</CardTitle>
                <CardDescription>Select your preferred measurement system</CardDescription>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setUnitPreference('imperial')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    unitPreference === 'imperial'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">Imperial</div>
                  <div className="text-sm text-muted-foreground">
                    Gallons • Fahrenheit • Inches
                  </div>
                </button>
                
                <button
                  onClick={() => setUnitPreference('metric')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    unitPreference === 'metric'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">Metric</div>
                  <div className="text-sm text-muted-foreground">
                    Liters • Celsius • Centimeters
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} disabled={isLoading}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Theme */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Monitor className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">Choose Your Theme</CardTitle>
                <CardDescription>Select your preferred appearance</CardDescription>
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
                    <div className="font-semibold text-lg">Light</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Bright and clear for daytime use
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
                    <div className="font-semibold text-lg">Dark</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Easy on the eyes in low light
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
                    <div className="font-semibold text-lg">System</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Matches your device settings
                  </div>
                </button>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(1)} variant="outline" disabled={isLoading}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={isLoading}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Language */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="text-center mb-6">
                <Languages className="w-16 h-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">Choose Your Language</CardTitle>
                <CardDescription>Select your preferred language</CardDescription>
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
                    English (United States)
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
                    Spanish (Spain)
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
                    French (France)
                  </div>
                </button>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setStep(2)} variant="outline" disabled={isLoading}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
