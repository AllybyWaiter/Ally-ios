import { useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';

interface ThemeWrapperProps {
  children: ReactNode;
}

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const auth = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!auth.loading && auth.themePreference) {
      setTheme(auth.themePreference);
    }
  }, [auth.themePreference, auth.loading, setTheme]);

  return <>{children}</>;
};
