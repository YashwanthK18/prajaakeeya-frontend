import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import en from './locales/en.json'; // keep English bundled as an instant fallback

void i18n
  // English is pre-bundled (above); every other language is fetched on demand
  // as its own chunk the first time it is selected.
  .use(resourcesToBackend((language: string) => import(`./locales/lazy/${language}.json`)))
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    load: 'languageOnly',
    supportedLngs: ['en', 'kn', 'hi', 'bn', 'te', 'ta', 'mr', 'gj', 'ma', 'od', 'rj', 'br'],
    partialBundledLanguages: true,
    resources: {
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
