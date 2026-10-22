// src/components/PitchSetupSelects.jsx
"use client";
import React from "react";
import { ZONE_COORDINATES, ZONE_EN } from "./StrikeZone";
import { useLanguage } from "@/context/LanguageContext";

export default function PitchSetupSelects({
  mode = "interactive",
  arsenal = [],
  pitchType,
  pitchZone,
  onTypeChange,
  onZoneChange,
}) {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  // ==========================================
  // 自動推演模式 (Builder)：左右並排、精確寬度比例
  // ==========================================
  if (mode === "builder") {
    return (
      <div
        style={{
          display: "flex",
          gap: "8px",
          width: "100%",
          alignItems: "center",
        }}
      >
        {/* 🌟 1. 球種選單：佔比提高至 1.6 (約 62% 寬度)，確保長字串與箭頭不打架 */}
        <select
          style={{
            flex: "1.6 1 0",
            minWidth: 0,
            height: "34px",
            padding: "0 8px",
            fontSize: "12px",
            fontWeight: "500",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#fff",
            color: "#334155",
            outline: "none",
            cursor: "pointer",
          }}
          value={pitchType}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          {arsenal?.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>

        {/* 🌟 2. 進壘位置選單：佔比 1.0 (約 38% 寬度)，緊湊俐落 */}
        <select
          style={{
            flex: "1 1 0",
            minWidth: 0,
            height: "34px",
            padding: "0 8px",
            fontSize: "12px",
            fontWeight: "500",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#fff",
            color: "#334155",
            outline: "none",
            cursor: "pointer",
          }}
          value={pitchZone}
          onChange={(e) => onZoneChange(e.target.value)}
        >
          {Object.keys(ZONE_COORDINATES).map((zone) => {
            const displayLabel = isEn
              ? ZONE_EN[zone] || zone
              : zone.replace("壞_", "壞_ ");
            return (
              <option key={zone} value={zone}>
                {displayLabel}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  // ==========================================
  // 沉浸互動模式 (Interactive)：上下排列
  // ==========================================
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
      }}
    >
      <div style={{ width: "100%" }}>
        <label
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: "#64748b",
            display: "block",
            marginBottom: "4px",
          }}
        >
          {isEn ? "Pitch Type" : "選擇球種"}
        </label>
        <select
          value={pitchType}
          onChange={(e) => onTypeChange(e.target.value)}
          style={{
            width: "100%",
            height: "36px",
            padding: "0 10px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#fff",
          }}
        >
          {arsenal?.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ width: "100%" }}>
        <label
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: "#64748b",
            display: "block",
            marginBottom: "4px",
          }}
        >
          {isEn ? "Location" : "進壘位置"}
        </label>
        <select
          value={pitchZone}
          onChange={(e) => onZoneChange(e.target.value)}
          style={{
            width: "100%",
            height: "36px",
            padding: "0 10px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#fff",
          }}
        >
          {Object.keys(ZONE_COORDINATES).map((zone) => {
            const displayLabel = isEn
              ? ZONE_EN[zone] || zone
              : zone.replace("壞_", "壞_ ");
            return (
              <option key={zone} value={zone}>
                {displayLabel}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
