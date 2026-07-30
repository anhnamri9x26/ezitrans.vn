export const supportedLocales = ["vi", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "vi";
export const localeCookieName = "NEXT_LOCALE";
