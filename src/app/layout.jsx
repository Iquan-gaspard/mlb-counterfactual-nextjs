// src/app/layout.jsx
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import PitcherProvider from "./PitcherProvider";
import LanguageToggle from "@/components/LanguageToggle";

export const metadata = {
  title: "MLB Pitch Sequence Simulator",
  description: "AI-powered pitch prediction and counterfactual analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        {/* 1. 最外層：多語系 Context */}
        <LanguageProvider>
          {/* 全域頂部導航列 (含雙語一鍵切換開關) */}
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 24px",
              borderBottom: "1px solid #eef2f6",
              background: "#fff",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚾</span> MLB Pitch Sequence Lab
            </div>
            <LanguageToggle />
          </header>

          {/* 2. 第二層：投手與導航外殼 Context，正式注入給所有 page */}
          <PitcherProvider>{children}</PitcherProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
