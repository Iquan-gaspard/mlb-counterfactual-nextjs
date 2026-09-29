"use client"; // 🌟 Next.js 魔法：宣告這個元件在瀏覽器端執行，允許使用 useState
import React, { useState, useEffect, createContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Select from "react-select";

// 🌟 使用 Node 環境變數來判斷 API 網址，解決以前 SSR 找不到 window 的問題
export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://baseball-web-game.onrender.com";

export const selectStyles = {
  menu: (provided) => ({ ...provided, zIndex: 9999 }),
  control: (provided) => ({ ...provided, borderRadius: "6px" }),
};

// 建立全域狀態通道
export const PitcherContext = createContext();

export default function PitcherProvider({ children }) {
  const pathname = usePathname(); // 取得目前網址，用來判斷哪個按鈕要亮起
  const [pitchers, setPitchers] = useState({});
  const [selectedPitcherId, setSelectedPitcherId] = useState("808967");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      <div className="container">
        <div className="controls">
          <strong style={{ fontSize: "18px" }}>對戰組合 (Matchup)：</strong>
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
            />
          </div>
        </div>

        <div className="tab-navigation">
          {/* 🌟 Next.js 專屬的 Link 元件與路徑判斷 */}
          <Link
            href="/"
            className={pathname === "/" ? "tab-btn active" : "tab-btn"}
          >
            📊 實戰打席分析 (Game At-Bats)
          </Link>
          <Link
            href="/builder"
            className={pathname === "/builder" ? "tab-btn active" : "tab-btn"}
          >
            🎯 自由配球實驗室 (Sequence Builder)
          </Link>
        </div>

        {/* 下方的分頁內容 (History 或 Builder) 會被注入到這裡 */}
        <div className="dashboard">{children}</div>
      </div>
    </PitcherContext.Provider>
  );
}
