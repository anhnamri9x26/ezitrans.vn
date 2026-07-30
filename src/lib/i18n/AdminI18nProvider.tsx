"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Locale } from "./config";

type I18nContextType = {
  locale: Locale;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function AdminI18nProvider({
  children,
  locale,
  dictionary,
}: {
  children: ReactNode;
  locale: Locale;
  dictionary: Record<string, string>;
}) {
  const t = (key: string) => {
    return dictionary[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an AdminI18nProvider");
  }
  return context;
}
