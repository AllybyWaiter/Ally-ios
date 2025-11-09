import { useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface LanguageWrapperProps {
  children: ReactNode;
}

export const LanguageWrapper = ({ children }: LanguageWrapperProps) => {
  const { languagePreference, loading } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!loading && languagePreference && i18n.language !== languagePreference) {
      i18n.changeLanguage(languagePreference);
    }
  }, [languagePreference, loading, i18n]);

  return <>{children}</>;
};
