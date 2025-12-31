import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext } from '@/lib/sentry';
import { UnitSystem } from '@/lib/unitConversions';
import { useAuthContext } from './AuthContext';

const PROFILE_TIMEOUT_MS = 3000;

interface ProfileContextType {
  userName: string | null;
  subscriptionTier: string | null;
  canCreateCustomTemplates: boolean;
  themePreference: string | null;
  languagePreference: string | null;
  unitPreference: string | null;
  hemisphere: string | null;
  units: UnitSystem;
  onboardingCompleted: boolean | null;
  profileLoading: boolean;
  currentStreak: number | null;
  longestStreak: number | null;
  lastTestDate: string | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, isInitialAuthComplete } = useAuthContext();
  
  const [userName, setUserName] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [canCreateCustomTemplates, setCanCreateCustomTemplates] = useState(false);
  const [themePreference, setThemePreference] = useState<string | null>(null);
  const [languagePreference, setLanguagePreference] = useState<string | null>(null);
  const [unitPreference, setUnitPreference] = useState<string | null>(null);
  const [hemisphere, setHemisphere] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [longestStreak, setLongestStreak] = useState<number | null>(null);
  const [lastTestDate, setLastTestDate] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, subscription_tier, theme_preference, language_preference, unit_preference, hemisphere, onboarding_completed, current_streak, longest_streak, last_test_date')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('🔴 Profile: Fetch error:', error.message);
        // Retry once before giving up - don't reset onboardingCompleted on temporary errors
        if (retryCount < 1) {
          console.warn('⚠️ Profile: Retrying fetch...');
          return fetchUserProfile(userId, retryCount + 1);
        }
        // Don't set onboardingCompleted to false on errors - preserve existing state
        return;
      }

      if (data) {
        setUserName(data.name);
        setSubscriptionTier(data.subscription_tier);
        setThemePreference(data.theme_preference);
        setLanguagePreference(data.language_preference);
        setUnitPreference(data.unit_preference);
        setHemisphere(data.hemisphere);
        setOnboardingCompleted(data.onboarding_completed === true);
        setCurrentStreak(data.current_streak ?? 0);
        setLongestStreak(data.longest_streak ?? 0);
        setLastTestDate(data.last_test_date);
        setCanCreateCustomTemplates(['plus', 'gold', 'enterprise'].includes(data.subscription_tier || ''));
        setUserContext(userId, undefined, data.name || undefined);
      } else {
        // No profile row exists - this is a genuinely new user who needs onboarding
        console.warn('⚠️ Profile: No data for user - new user needs onboarding');
        setOnboardingCompleted(false);
      }
    } catch (error: any) {
      console.error('🔴 Profile: Exception:', error.message);
      // Retry once on exception
      if (retryCount < 1) {
        console.warn('⚠️ Profile: Retrying after exception...');
        return fetchUserProfile(userId, retryCount + 1);
      }
      // Don't set onboardingCompleted to false on errors - preserve existing state
    }
  }, []);

  const clearProfile = useCallback(() => {
    setUserName(null);
    setSubscriptionTier(null);
    setCanCreateCustomTemplates(false);
    setThemePreference(null);
    setLanguagePreference(null);
    setUnitPreference(null);
    setHemisphere(null);
    setCurrentStreak(null);
    setLongestStreak(null);
    setLastTestDate(null);
    // Use null (unknown) instead of false - we don't know onboarding state when logged out
    setOnboardingCompleted(null);
  }, []);

  useEffect(() => {
    if (!isInitialAuthComplete) return;

    if (!user) {
      clearProfile();
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    const profileTimeout = setTimeout(() => {
      console.warn('⚠️ Profile: Timeout, continuing...');
      // Don't default to false on timeout - preserve existing state or leave as null
      // Dashboard will handle null state appropriately
      setProfileLoading(false);
    }, PROFILE_TIMEOUT_MS);

    fetchUserProfile(user.id).finally(() => {
      clearTimeout(profileTimeout);
      setProfileLoading(false);
    });
  }, [user?.id, isInitialAuthComplete, fetchUserProfile, clearProfile]);

  // Visibility-based recovery for iOS PWA
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || !user || !isInitialAuthComplete) return;
      
      const recoveryTimeout = setTimeout(() => {
        setProfileLoading(false);
        // Don't default to false on visibility recovery - preserve existing state
      }, 1500);

      try {
        await fetchUserProfile(user.id);
      } finally {
        clearTimeout(recoveryTimeout);
        setProfileLoading(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id, isInitialAuthComplete, fetchUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  return (
    <ProfileContext.Provider value={{
      userName,
      subscriptionTier,
      canCreateCustomTemplates,
      themePreference,
      languagePreference,
      unitPreference,
      hemisphere,
      units: (unitPreference as UnitSystem) || 'imperial',
      onboardingCompleted,
      profileLoading,
      currentStreak,
      longestStreak,
      lastTestDate,
      refreshProfile
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    return {
      userName: null,
      subscriptionTier: null,
      canCreateCustomTemplates: false,
      themePreference: null,
      languagePreference: null,
      unitPreference: null,
      hemisphere: null,
      units: 'imperial' as UnitSystem,
      onboardingCompleted: null,
      profileLoading: true,
      currentStreak: null,
      longestStreak: null,
      lastTestDate: null,
      refreshProfile: async () => {},
    };
  }
  return context;
};
