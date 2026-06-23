import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supportedLanguages } from "../i18n/index.js";

const languageLabels = {
  fr: "FR",
  en: "EN",
};

export default function LanguageSwitcher({ compact = false }) {
  const { i18n, t } = useTranslation();

  const currentLanguage = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "fr"
  ).split("-")[0];

  const changeLanguage = (language) => {
    if (language !== currentLanguage) {
      i18n.changeLanguage(language);
    }
  };

  const visibleLanguages = supportedLanguages.filter(
    (language) => language === "fr" || language === "en",
  );

  return (
    <div
      className={`language-switcher ${compact ? "compact" : ""}`}
      aria-label={t("language.label")}
    >
      {!compact && <Languages size={16} />}

      {visibleLanguages.map((language) => (
        <button
          className={currentLanguage === language ? "active" : ""}
          type="button"
          key={language}
          onClick={() => changeLanguage(language)}
          aria-pressed={currentLanguage === language}
        >
          {languageLabels[language]}
        </button>
      ))}
    </div>
  );
}