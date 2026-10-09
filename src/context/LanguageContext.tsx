import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "kn";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (en: string, kn: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("areca_lang");
    return saved === "kn" ? "kn" : "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("areca_lang", newLang);
    document.documentElement.setAttribute("lang", newLang);
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "kn" : "en");
  };

  const t = (en: string, kn: string) => {
    return lang === "kn" ? kn : en;
  };

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
