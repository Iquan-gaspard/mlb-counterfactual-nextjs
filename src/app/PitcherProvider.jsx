"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Select from "react-select";
import { useLanguage } from "@/context/LanguageContext"; // 🌟 引入語系 Hook

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://baseball-web-game.onrender.com";

export const selectStyles = {
  menu: (provided) => ({ ...provided, zIndex: 9999 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (provided) => ({ ...provided, borderRadius: "6px" }),
};

// 🌟 防禦性架構：給予安全預設物件，杜絕 Cannot destructure property 致命崩潰！
export const PitcherContext = createContext({
  pitcherId: "808967",
  pitcherData: null,
});

// 提供標準自定義 Hook
export function usePitcher() {
  const context = useContext(PitcherContext);
  if (!context) {
    throw new Error("usePitcher 必須在 PitcherProvider 內部使用");
  }
  return context;
}

export default function PitcherProvider({ children }) {
  const pathname = usePathname();
  const { t } = useLanguage(); // 🌟 取得翻譯工具
  const [pitchers, setPitchers] = useState({});
  const [selectedPitcherId, setSelectedPitcherId] = useState("808967");
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    async function loadPitchers() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/pitchers");
        if (!res.ok) throw new Error("無法取得投手資料");
        const data = await res.json();

        const pitcherMap = {};
        if (Array.isArray(data)) {
          data.forEach((p) => {
            pitcherMap[p.pitcher_id] = {
              name: p.name,
              p_throws: p.throws,
              throws: p.throws,
              arm_angle: p.arm_angle,
              arsenal: p.arsenal,
            };
          });
        } else {
          Object.assign(pitcherMap, data);
        }

        setPitchers(pitcherMap);
      } catch (err) {
        console.error("載入投手失敗：", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPitchers();
  }, []);

  const pitcherOptions = Object.keys(pitchers)
    .sort((a, b) => (a === "808967" ? -1 : 1))
    .map((pId) => ({ value: pId, label: pitchers[pId].name }));

  return (
    <PitcherContext.Provider
      value={{
        pitcherId: selectedPitcherId,
        pitcherData: pitchers[selectedPitcherId] || null,
      }}
    >
      <div className="container" style={{ overflowX: "hidden" }}>
        {/* 頂部投手選擇列 */}
        <div
          className="controls"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "15px 25px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            marginBottom: "20px",
          }}
        >
          <strong
            style={{ fontSize: "16px", color: "#555", whiteSpace: "nowrap" }}
          >
            {t("matchup")}：
          </strong>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <Select
              instanceId="pitcher-select"
              value={
                pitcherOptions.find((opt) => opt.value === selectedPitcherId) ||
                null
              }
              onChange={(selectedOption) =>
                setSelectedPitcherId(selectedOption.value)
              }
              options={pitcherOptions}
              isLoading={isLoading}
              isSearchable={true}
              placeholder={
                t("search_pitcher") || "搜尋投手 (Search Pitcher)..."
              }
              styles={selectStyles}
              menuPortalTarget={isMounted ? document.body : null}
              menuPosition="fixed"
            />
          </div>
        </div>

        {/* 頁籤導航 (Tabs) */}
        <div
          className="tab-navigation"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <Link
            href="/"
            className={pathname === "/" ? "tab-btn active" : "tab-btn"}
            style={{
              flex: "1 1 120px",
              padding: "12px 10px",
              textAlign: "center",
            }}
          >
            📊 {t("tab_atbat")}
          </Link>
          <Link
            href="/builder"
            className={pathname === "/builder" ? "tab-btn active" : "tab-btn"}
            style={{
              flex: "1 1 120px",
              padding: "12px 10px",
              textAlign: "center",
            }}
          >
            🎯 {t("tab_builder")}
          </Link>
          <Link
            href="/interactive"
            className={
              pathname === "/interactive" ? "tab-btn active" : "tab-btn"
            }
            style={{
              flex: "1 1 120px",
              padding: "12px 10px",
              textAlign: "center",
              backgroundColor: pathname === "/interactive" ? "#27ae60" : "",
              color: pathname === "/interactive" ? "#fff" : "",
            }}
          >
            🎮 {t("tab_interactive")}
          </Link>
        </div>

        {/* 分頁內容 */}
        <div className="dashboard">{children}</div>
      </div>
    </PitcherContext.Provider>
  );
}
