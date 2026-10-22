"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("zh"); // 預設繁中
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. 優先讀取使用者先前儲存的偏好
    const savedLang = localStorage.getItem("preferred_lang");
    if (savedLang === "zh" || savedLang === "en") {
      setLang(savedLang);
    } else {
      // 2. 若無紀錄，依據瀏覽器語系自動判定
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && !browserLang.toLowerCase().startsWith("zh")) {
        setLang("en");
      }
    }
    setMounted(true);
  }, []);

  const switchLanguage = (targetLang) => {
    setLang(targetLang);
    localStorage.setItem("preferred_lang", targetLang);
  };

  const toggleLanguage = () => {
    const nextLang = lang === "zh" ? "en" : "zh";
    switchLanguage(nextLang);
  };

  // 翻譯輔助函式
  const t = (key) => {
    if (!translations[lang] || !translations[lang][key]) {
      // 若遺漏 key 則 fallback 回中文
      return translations.zh[key] || key;
    }
    return translations[lang][key];
  };

  return (
    <LanguageContext.Provider
      value={{ lang, switchLanguage, toggleLanguage, t, mounted }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage 必須在 LanguageProvider 內部使用");
  }
  return context;
}
