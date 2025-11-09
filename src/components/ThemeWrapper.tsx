import { useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';

interface ThemeWrapperProps {
  children: ReactNode;
}

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const { themePreference, loading } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!loading && themePreference) {
      setTheme(themePreference);
    }
  }, [themePreference, loading, setTheme]);

  return <>{children}</>;
};
