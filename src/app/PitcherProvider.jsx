"use client";
import React, { useState, useEffect, createContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Select from "react-select";

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://baseball-web-game.onrender.com";

// 🌟 新增 menuPortal 樣式，確保選單出竅後層級最高
export const selectStyles = {
  menu: (provided) => ({ ...provided, zIndex: 9999 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (provided) => ({ ...provided, borderRadius: "6px" }),
};

export const PitcherContext = createContext();

export default function PitcherProvider({ children }) {
  const pathname = usePathname();
  const [pitchers, setPitchers] = useState({});
  const [selectedPitcherId, setSelectedPitcherId] = useState("808967");
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 破框魔法必備：確認元件已經掛載到瀏覽器上
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function fetchPitchers() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pitchers`);
        const data = await response.json();
        setPitchers(data);
      } catch (error) {
        console.error("無法載入投手清單", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPitchers();
  }, []);

  const pitcherOptions = Object.keys(pitchers)
    .sort((a, b) => (a === "808967" ? -1 : 1))
    .map((pId) => ({ value: pId, label: pitchers[pId].name }));

  return (
    <PitcherContext.Provider
      value={{
        pitcherId: selectedPitcherId,
        pitcherData: pitchers[selectedPitcherId],
      }}
    >
      {/* 🌟 修正 1：拔除 maxWidth: "100%"，讓畫面恢復置中且適當寬度 */}
      <div className="container" style={{ overflowX: "hidden" }}>
        {/* 🌟 修正 2：拔除 flexDirection: "column"，讓桌機版恢復左右並排。手機版會由 globals.css 自動接管變成上下排列 */}
        <div
          className="controls"
          style={{
            display: "flex",
            alignItems: "center", // 恢復垂直置中對齊
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
            對戰組合 (Matchup)：
          </strong>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <Select
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
              placeholder="請輸入英文搜尋投手 (Search Pitcher)..."
              styles={selectStyles}
              menuPortalTarget={isMounted ? document.body : null}
              menuPosition="fixed"
            />
          </div>
        </div>

        {/* 頁籤按鈕 (Tabs) 維持自動換行的設定 */}
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
            style={{ flex: "1 1 120px", padding: "12px 10px" }}
          >
            📊 實戰打席分析
          </Link>
          <Link
            href="/builder"
            className={pathname === "/builder" ? "tab-btn active" : "tab-btn"}
            style={{ flex: "1 1 120px", padding: "12px 10px" }}
          >
            🎯 傳統自由配球
          </Link>
          <Link
            href="/interactive"
            className={
              pathname === "/interactive" ? "tab-btn active" : "tab-btn"
            }
            style={{
              flex: "1 1 120px",
              padding: "12px 10px",
              backgroundColor: pathname === "/interactive" ? "#27ae60" : "",
              color: pathname === "/interactive" ? "#fff" : "",
            }}
          >
            🎮 沉浸式配球推演
          </Link>
        </div>

        {/* 下方的分頁內容 */}
        <div className="dashboard">{children}</div>
      </div>
    </PitcherContext.Provider>
  );
}
