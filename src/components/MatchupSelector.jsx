// src/components/MatchupSelector.jsx
"use client";
import React from "react";
import Select from "react-select";
import { useLanguage } from "@/context/LanguageContext";

export default function MatchupSelector({
  batters = [],
  isLoading = false,
  selectedBatterId,
  setSelectedBatterId,
  selectedStand,
  setSelectedStand,
  selectStyles,
  onMatchupChange,
}) {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  // 1. 組裝打者選項，並將 stand 綁定至 option 物件中
  const batterOptions = batters.map((b) => {
    let cleanLabel = b.label || b.name || "";
    if (isEn) {
      cleanLabel = cleanLabel
        .replace(/（左打）|\(左打\)/g, " (LHB)")
        .replace(/（右打）|\(右打\)/g, " (RHB)");
    } else {
      cleanLabel = cleanLabel
        .replace(/\s*\(LHB\)/g, " (左打)")
        .replace(/\s*\(RHB\)/g, " (右打)");
    }

    // 🌟 防呆解析：若後端資料未帶 stand，則從標籤中提取 L 或 R
    const detectedStand =
      b.stand ||
      (cleanLabel.includes("左") || cleanLabel.includes("LHB") ? "L" : "R");

    return {
      value: b.batter_id ? b.batter_id.toString() : "",
      label: cleanLabel,
      stand: detectedStand, // 🌟 掛載打擊站位 (L 或 R)
    };
  });

  return (
    <div
      className="controls"
      style={{
        display: "flex",
        gap: "20px",
        alignItems: "center",
        background: "#fff",
        padding: "15px 25px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >
      {/* 打者選擇 */}
      <div style={{ flex: "2 1 250px", minWidth: "220px" }}>
        <strong
          style={{
            fontSize: "15px",
            color: "#555",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {isEn ? "Batter :" : "對戰打者 :"}
        </strong>
        <Select
          instanceId="batter-select"
          value={
            batterOptions.find(
              (opt) => opt.value === selectedBatterId?.toString()
            ) || null
          }
          onChange={(opt) => {
            if (!opt) return;

            // 🌟 1. 更新選中的打者 ID
            if (setSelectedBatterId) {
              setSelectedBatterId(opt.value);
            }

            // 🌟 2. 關鍵修復：更換打者時，自動同步更新站位 (Stand)！
            if (opt.stand && setSelectedStand) {
              setSelectedStand(opt.stand);
            }

            // 🌟 3. 觸發外部自定義切換回呼 (例如清空舊的沙盤推演結果)
            if (onMatchupChange) {
              onMatchupChange();
            }
          }}
          options={batterOptions}
          isLoading={isLoading}
          isSearchable={true}
          placeholder={isEn ? "Search Batter..." : "搜尋打者..."}
          styles={selectStyles}
        />
      </div>

      {/* 站位選擇 (使用者仍可手動覆寫，例如測試反事實站位) */}
      <div style={{ flex: "1 1 120px", minWidth: "140px" }}>
        <strong
          style={{
            fontSize: "15px",
            color: "#555",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {isEn ? "Stand :" : "站位 :"}
        </strong>
        <select
          value={selectedStand}
          onChange={(e) => {
            if (setSelectedStand) setSelectedStand(e.target.value);
            if (onMatchupChange) onMatchupChange();
          }}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            backgroundColor: "#fff",
            color: "#333",
          }}
        >
          <option value="L">{isEn ? "Left" : "左打"}</option>
          <option value="R">{isEn ? "Right" : "右打"}</option>
        </select>
      </div>
    </div>
  );
}
