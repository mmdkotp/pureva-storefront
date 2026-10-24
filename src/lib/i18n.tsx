import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Ctx = { lang: Lang; t: (ar: string, en: string) => string; toggle: () => void };

const I18nContext = createContext<Ctx>({ lang: "ar", t: (ar) => ar, toggle: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem("pureva-lang");
    if (saved === "en" || saved === "ar") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("pureva-lang", lang);
  }, [lang]);

  const t = useCallback((ar: string, en: string) => (lang === "ar" ? ar : en), [lang]);
  const toggle = useCallback(() => setLang((l) => (l === "ar" ? "en" : "ar")), []);

  return <I18nContext.Provider value={{ lang, t, toggle }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
