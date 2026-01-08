import { useEffect, useState, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';

interface ThemeWrapperProps {
  children: ReactNode;
}

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const auth = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!auth.loading && auth.themePreference && mounted) {
      setTheme(auth.themePreference);
    }
  }, [auth.themePreference, auth.loading, setTheme, mounted]);

  // During SSR/initial hydration, apply a minimal placeholder to prevent flash
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};
