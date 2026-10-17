import React from "react";
import { ZONE_EN } from "./StrikeZone";

export default function PitchResultCard({
  mode = "interactive", // 模式區分: "interactive" 沉浸互動 或 "builder" 自動推演
  pitchNum,
  type,
  zone,
  probs,
  outcome,
  bCount,
  sCount,
  isWalk = false,
  isFinal = false,
}) {
  // 1. 顏色與樣式邏輯判斷
  let borderColor, bgColor, bottomBgColor;

  if (mode === "builder") {
    // 自動推演模式：依據保送、最終球給予顏色
    borderColor = isWalk ? "#27ae60" : isFinal ? "#c0392b" : "#e67e22";
    bgColor = isFinal ? "#fdf2e9" : "#fff";
    bottomBgColor = isFinal ? "#fbeee6" : "#f8f9fa";
  } else {
    // 沉浸互動模式：嚴格依據好壞球給予紅綠色
    const isStrike = !(outcome === "Take" && zone.includes("壞"));
    // 🌟 將這裡的 #e74c3c 替換成磚紅色 #c0392b
    borderColor = isStrike ? "#c0392b" : "#27ae60";
    bgColor = "#fff";
    bottomBgColor = "#f8f9fa";
  }

  // 2. 機率數值防呆
  const pTake = probs?.take ?? "--";
  const pWhiff = probs?.whiff ?? "--";
  const pFoul = probs?.foul ?? "--";
  const pWeak = probs?.weak ?? "--";
  const pHard = probs?.hard ?? "--";

  return (
    <div
      className="pitch-item modified"
      style={{
        borderColor: borderColor,
        background: bgColor,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "10px 14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
        <div
          className="pitch-number"
          style={{
            background: borderColor,
            flexShrink: 0,
            width: "26px",
            height: "26px",
            fontSize: "13px",
          }}
        >
          {pitchNum}
        </div>
        <div
          className="pitch-info"
          style={{ flex: 1, minWidth: 0, marginLeft: "10px" }}
        >
          <div style={{ color: "#333", marginBottom: "6px", fontSize: "15px" }}>
            <strong>{type}</strong> ({ZONE_EN[zone] || zone})
          </div>

          <div
            className="badge-container"
            style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
          >
            <span
              className="badge badge-take"
              style={{
                opacity: outcome === "Take" ? 1 : 0.35,
                padding: "4px 8px",
                fontSize: "12px",
                flex: "1 1 auto",
                textAlign: "center",
              }}
            >
              👀 Take {pTake}%
            </span>
            <span
              className="badge badge-whiff"
              style={{
                opacity: outcome === "Whiff" ? 1 : 0.35,
                padding: "4px 8px",
                fontSize: "12px",
                flex: "1 1 auto",
                textAlign: "center",
              }}
            >
              💨 Whiff {pWhiff}%
            </span>
            <span
              className="badge badge-foul"
              style={{
                opacity: outcome === "Foul" ? 1 : 0.35,
                padding: "4px 8px",
                fontSize: "12px",
                flex: "1 1 auto",
                textAlign: "center",
              }}
            >
              🛑 Foul {pFoul}%
            </span>
            <span
              className="badge badge-weak"
              style={{
                opacity: outcome === "Weak" ? 1 : 0.35,
                padding: "4px 8px",
                fontSize: "12px",
                flex: "1 1 auto",
                textAlign: "center",
              }}
            >
              🏏 Weak {pWeak}%
            </span>
            <span
              className="badge badge-hard"
              style={{
                opacity: outcome === "Hard" ? 1 : 0.35,
                padding: "4px 8px",
                fontSize: "12px",
                flex: "1 1 auto",
                textAlign: "center",
              }}
            >
              🚀 Hard {pHard}%
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "8px",
          width: "100%",
          padding: "8px 12px",
          background: bottomBgColor,
          borderRadius: "6px",
          borderLeft: `4px solid ${borderColor}`,
          fontSize: "14px",
          color: "#2c3e50",
        }}
      >
        {isWalk && mode === "builder" ? (
          <strong style={{ color: "#27ae60" }}>
            🚶 Walk - Auto-sequence terminated!
          </strong>
        ) : isFinal && mode === "builder" ? (
          <div style={{ color: "#c0392b" }}>
            <strong>🎯 Final Pitch (Expected Value)</strong>
            <div style={{ marginTop: "4px", color: "#555", fontSize: "13px" }}>
              Final Count: {bCount} B - {sCount} S
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              Outcome: <strong style={{ marginLeft: "5px" }}>{outcome}</strong>
            </span>
            {/* 只有當有傳入球數時才顯示右側結算 (Builder 專用) */}
            {bCount !== undefined && sCount !== undefined && (
              <strong style={{ letterSpacing: "1px" }}>
                {bCount} B - {sCount} S
              </strong>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
