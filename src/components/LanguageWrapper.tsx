import { useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface LanguageWrapperProps {
  children: ReactNode;
}

export const LanguageWrapper = ({ children }: LanguageWrapperProps) => {
  const auth = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!auth.loading && auth.languagePreference && i18n.language !== auth.languagePreference) {
      i18n.changeLanguage(auth.languagePreference);
    }
  }, [auth.languagePreference, auth.loading, i18n]);

  return <>{children}</>;
};
