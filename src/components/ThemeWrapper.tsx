import { useEffect, useState, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';

interface ThemeWrapperProps {
  children: ReactNode;
}

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const auth = useAuth();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!auth.loading && auth.themePreference && mounted) {
      setTheme(auth.themePreference);

      // Force immediate DOM update for Capacitor/iOS WebView
      const root = document.documentElement;
      if (auth.themePreference === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else if (auth.themePreference === 'light') {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      } else if (auth.themePreference === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) {
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        }
      }
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
