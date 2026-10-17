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
      {/* 🌟 加入 overflowX: "hidden" 徹底杜絕整個網頁的水平卷軸 */}
      <div
        className="container"
        style={{ overflowX: "hidden", maxWidth: "100%" }}
      >
        {/* =========================================
            🌟 修正 1：最上方的「投手選擇區塊」
            強制改為上下排列 (column)，保證 100% 寬度不破版
            ========================================= */}
        <div
          className="controls"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "15px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            marginBottom: "20px",
          }}
        >
          <strong style={{ fontSize: "16px", color: "#555" }}>
            對戰組合 (Matchup)：
          </strong>
          <div style={{ width: "100%" }}>
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
              // 🌟 終極破框魔法：讓選單渲染在 body 標籤上
              menuPortalTarget={isMounted ? document.body : null}
              menuPosition="fixed"
            />
          </div>
        </div>

        {/* =========================================
            🌟 修正 2：頁籤按鈕 (Tabs)
            加入 flexWrap: "wrap"，當手機螢幕太窄時，按鈕會自動掉到下一行！
            ========================================= */}
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
            // flex: "1 1 120px" 代表按鈕會自適應拉伸，但最小不低於 120px
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
