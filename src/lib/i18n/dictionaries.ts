import vi from "./locales/vi.json";
import en from "./locales/en.json";
import { Locale } from "./config";

const dictionaries: Record<Locale, Record<string, string>> = {
  vi,
  en,
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries["vi"];
}
