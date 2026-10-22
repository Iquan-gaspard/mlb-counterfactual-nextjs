// src/components/LanguageToggle.jsx
"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageToggle() {
  const { lang, switchLanguage, mounted } = useLanguage();

  if (!mounted) {
    return <div style={{ width: "110px", height: "34px" }} />;
  }

  const isZh = lang === "zh";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        cursor: "pointer",
        userSelect: "none",
      }}
      role="group"
      aria-label="Language Toggle"
    >
      {/* 中文按鈕 */}
      <button
        type="button"
        onClick={() => switchLanguage("zh")}
        style={{
          border: "none",
          outline: "none",
          padding: "6px 14px",
          fontSize: "14px",
          fontWeight: isZh ? "bold" : "600",
          backgroundColor: isZh ? "#2b5c8f" : "transparent", // 🌟 選中時深藍色背景
          color: isZh ? "#ffffff" : "#475569", // 🌟 未選中為沉穩灰
          cursor: "pointer",
          transition: "all 0.15s ease-in-out",
        }}
      >
        中文
      </button>

      {/* EN 按鈕 */}
      <button
        type="button"
        onClick={() => switchLanguage("en")}
        style={{
          border: "none",
          outline: "none",
          padding: "6px 16px",
          fontSize: "14px",
          fontWeight: !isZh ? "bold" : "600",
          backgroundColor: !isZh ? "#2b5c8f" : "transparent", // 🌟 選中時深藍色背景
          color: !isZh ? "#ffffff" : "#475569",
          cursor: "pointer",
          transition: "all 0.15s ease-in-out",
        }}
      >
        EN
      </button>
    </div>
  );
}
