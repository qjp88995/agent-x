import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
  });

// Sync <html lang="..."> with current language
const syncHtmlLang = (lng: string) => {
  document.documentElement.lang = lng;
};
syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

// Sync language across browser tabs via storage event
window.addEventListener('storage', e => {
  if (e.key === 'language' && e.newValue && e.newValue !== i18n.language) {
    void i18n.changeLanguage(e.newValue);
  }
});

export default i18n;
