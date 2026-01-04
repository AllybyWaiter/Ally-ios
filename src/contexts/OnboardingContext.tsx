import { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingContextValue {
  isOnboarding: boolean;
  setIsOnboarding: (value: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false);

  return (
    <OnboardingContext.Provider value={{ isOnboarding, setIsOnboarding }}>
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
