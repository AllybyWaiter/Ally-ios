import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      es,
      fr,
    },
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
