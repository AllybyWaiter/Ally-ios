import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';

// Dynamic locale loading - only load English by default
// Other locales are loaded on demand when user changes language
const loadLocale = async (lng: string) => {
  switch (lng) {
    case 'es':
      return (await import('./locales/es')).es;
    case 'fr':
      return (await import('./locales/fr')).fr;
    default:
      return en;
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en, // Only English is bundled initially
    },
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Add locale on language change
i18n.on('languageChanged', async (lng) => {
  if (lng !== 'en' && !i18n.hasResourceBundle(lng, 'translation')) {
    const resources = await loadLocale(lng);
    i18n.addResourceBundle(lng, 'translation', resources.translation, true, true);
  }
});

export default i18n;
