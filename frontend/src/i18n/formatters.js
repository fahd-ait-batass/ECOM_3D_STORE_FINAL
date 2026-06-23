export function getLocale(language) {
  if (language?.startsWith("ar")) {
    return "ar-MA";
  }
  if (language?.startsWith("en")) {
    return "en-US";
  }
  return "fr-FR";
}

export function formatLocalizedDate(value, language, options = { dateStyle: "medium" }) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat(getLocale(language), options).format(new Date(value));
}

export function formatLocalizedNumber(value, language) {
  return new Intl.NumberFormat(getLocale(language)).format(Number(value || 0));
}
