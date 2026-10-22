"use client";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";

// 物理中心點座標保持不變
export const ZONE_COORDINATES = {
  左上: { x: 17, y: 17 },
  中上: { x: 50, y: 17 },
  右上: { x: 83, y: 17 },
  左中: { x: 17, y: 50 },
  正中: { x: 50, y: 50 },
  右中: { x: 83, y: 50 },
  左下: { x: 17, y: 83 },
  中下: { x: 50, y: 83 },
  右下: { x: 83, y: 83 },
  壞_左上: { x: -17, y: -17 },
  壞_中上: { x: 50, y: -17 },
  壞_右上: { x: 117, y: -17 },
  壞_左中: { x: -17, y: 50 },
  壞_右中: { x: 117, y: 50 },
  壞_左下: { x: -17, y: 117 },
  壞_中下: { x: 50, y: 117 },
  壞_右下: { x: 117, y: 117 },
  壞_挖地瓜: { x: 50, y: 134 },
};

export const ZONE_EN = {
  左上: "Top-L",
  中上: "Top-M",
  右上: "Top-R",
  左中: "Mid-L",
  正中: "Middle",
  右中: "Mid-R",
  左下: "Bot-L",
  中下: "Bot-M",
  右下: "Bot-R",
  壞_左上: "Chase Top-L",
  壞_中上: "Chase Top-M",
  壞_右上: "Chase Top-R",
  壞_左中: "Chase Mid-L",
  壞_右中: "Chase Mid-R",
  壞_左下: "Chase Bot-L",
  壞_中下: "Chase Bot-M",
  壞_右下: "Chase Bot-R",
  壞_挖地瓜: "In the Dirt",
};

export default function StrikeZone({ pitches = [], onZoneClick }) {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  const renderCells = () => {
    return Array.from({ length: 9 }).map((_, idx) => (
      <div
        key={idx}
        className="zone-cell"
        onClick={() => onZoneClick && onZoneClick(idx)}
      ></div>
    ));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        userSelect: "none",
      }}
    >
      {/* 🌟 1. 頂部視角提示微膠囊標籤 */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "0.5px",
          color: "#64748b",
          backgroundColor: "#f1f5f9",
          padding: "2px 10px",
          borderRadius: "12px",
          marginBottom: "10px",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          border: "1px solid #e2e8f0",
        }}
      >
        <span>👁️</span>
        <span>{isEn ? "Catcher's Perspective" : "捕手視角"}</span>
      </div>

      {/* 🌟 2. 好球帶繪圖容器 (含左右打擊區標籤與九宮格) */}
      <div
        className="pitch-plot-container"
        style={{
          width: "100%",
          maxWidth: "340px",
          minHeight: "260px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* 左右打者打擊區提示 (捕手視角：左為右打 RHB，右為左打 LHB) */}
        <div
          style={{
            position: "absolute",
            left: "8px",
            fontSize: "11px",
            fontWeight: "bold",
            color: "#94a3b8",
            writingMode: "vertical-rl",
            letterSpacing: "2px",
            opacity: 0.8,
          }}
        >
          {isEn ? "RHB BOX" : "右打區"}
        </div>
        <div
          style={{
            position: "absolute",
            right: "8px",
            fontSize: "11px",
            fontWeight: "bold",
            color: "#94a3b8",
            writingMode: "vertical-rl",
            letterSpacing: "2px",
            opacity: 0.8,
          }}
        >
          {isEn ? "LHB BOX" : "左打區"}
        </div>

        {/* 九宮格主體 */}
        <div className="strike-zone" style={{ position: "relative" }}>
          {renderCells()}

          {/* 🌟 3. 捕手視角本壘板 (Home Plate SVG) */}
          {/* 🌟 捕手視角本壘板 (往下微調位置) */}
          <svg
            viewBox="0 0 100 48"
            style={{
              position: "absolute",
              top: "calc(100% + 45px)", // 🌟 從 100.5% 改為往下移 10px (亦可嘗試 +12px 或 108%)
              left: "0",
              width: "100%",
              height: "36px",
              zIndex: 1,
              filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.12))",
              pointerEvents: "none",
            }}
          >
            {/* 本壘板黑邊底板 */}
            <polygon points="0,0 100,0 100,20 50,46 0,20" fill="#334155" />
            {/* 本壘板正面白板 */}
            <polygon points="2,2 98,2 98,19 50,44 2,19" fill="#ffffff" />
            {/* 倒角反光線 */}
            <polygon
              points="5,4 95,4 95,17 50,40 5,17"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="1.5"
            />
          </svg>

          {/* 投球點位渲染 */}
          {pitches.map((pitch, idx) => {
            const bgColor = pitch.isStrike ? "#c0392b" : "#27ae60";
            const isCurrent = pitch.isModified;

            const borderStyle = isCurrent
              ? "3px solid #f1c40f"
              : "1px solid rgba(255,255,255,0.7)";
            const transformStyle = isCurrent
              ? "translate(-50%, -50%) scale(1.15)"
              : "translate(-50%, -50%)";

            return (
              <div
                key={idx}
                className="pitch-dot"
                style={{
                  left: `${pitch.x}%`,
                  top: `${pitch.y}%`,
                  backgroundColor: bgColor,
                  border: borderStyle,
                  opacity: pitch.opacity || 1,
                  transform: transformStyle,
                  zIndex: isCurrent ? 20 : 10,
                  boxShadow: isCurrent
                    ? "0 0 10px rgba(241, 196, 15, 0.8)"
                    : "1px 1px 3px rgba(0,0,0,0.4)",
                }}
              >
                {pitch.num}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🌟 4. 底部圖例 */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "15px",
          fontSize: "13px",
          fontWeight: "bold",
          color: "#555",
          background: "#fff",
          padding: "6px 16px",
          borderRadius: "20px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#c0392b",
              borderRadius: "50%",
            }}
          ></div>
          <span>{isEn ? "Strike" : "好球"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#27ae60",
              borderRadius: "50%",
            }}
          ></div>
          <span>{isEn ? "Ball" : "壞球"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "transparent",
              border: "3px solid #f1c40f",
              borderRadius: "50%",
            }}
          ></div>
          <span>{isEn ? "Current" : "當前球"}</span>
        </div>
      </div>
    </div>
  );
}
