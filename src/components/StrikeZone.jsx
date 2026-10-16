import React from "react";

// 完美對接後端的物理中心點座標
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
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div className="pitch-plot-container">
        <div className="strike-zone">
          {renderCells()}

          {pitches.map((pitch, idx) => {
            // 🌟 核心顏色邏輯：好球紅色、壞球綠色
            const bgColor = pitch.isStrike ? "#e74c3c" : "#2ecc71"; // 紅色(Strike) / 綠色(Ball)
            const isCurrent = pitch.isModified;

            // 當前球加上粗黃色外框與放大效果，歷史球維持細白框
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

      {/* 🌟 新增：好壞球圖例與英文翻譯 */}
      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "15px",
          fontSize: "13px",
          fontWeight: "bold",
          color: "#555",
          background: "#fff",
          padding: "8px 15px",
          borderRadius: "20px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#e74c3c",
              borderRadius: "50%",
            }}
          ></div>
          <span>好球 (Strike)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#2ecc71",
              borderRadius: "50%",
            }}
          ></div>
          <span>壞球 (Ball)</span>
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
          <span>當前球 (Current)</span>
        </div>
      </div>
    </div>
  );
}
