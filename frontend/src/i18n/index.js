import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar.js";
import en from "./locales/en.js";
import fr from "./locales/fr.js";

export const LANGUAGE_STORAGE_KEY = "ecom_3d_language";
export const supportedLanguages = ["fr", "ar", "en"];

function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return supportedLanguages.includes(saved) ? saved : "fr";
  } catch {
    return "fr";
  }
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: getSavedLanguage(),
  fallbackLng: "fr",
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Local storage can be unavailable in privacy modes; i18n still works in memory.
  }
});

export default i18n;
