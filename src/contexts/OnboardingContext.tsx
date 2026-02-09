import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface OnboardingContextValue {
  isOnboarding: boolean;
  setIsOnboarding: (value: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false);

  const value = useMemo(() => ({ isOnboarding, setIsOnboarding }), [isOnboarding]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// Optional hook that doesn't throw if used outside provider
export function useOnboardingOptional() {
  return useContext(OnboardingContext);
}
