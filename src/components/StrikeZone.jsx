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

/**
 * 九宮格 UI 元件
 * @param {Array} pitches - 要繪製的球跡陣列 [{x, y, isStrike, isModified, num}]
 * @param {Function} onZoneClick - (選填) 如果在自由配球模式，點擊九宮格時觸發的事件
 */
export default function StrikeZone({ pitches = [], onZoneClick }) {
  // 生成 9 個好球帶格子
  const renderCells = () => {
    return Array.from({ length: 9 }).map((_, idx) => (
      <div
        key={idx}
        className="zone-cell"
        onClick={() => onZoneClick && onZoneClick(idx)} // 預留給自由配球點擊用
      ></div>
    ));
  };

  return (
    <div className="pitch-plot-container">
      <div className="strike-zone">
        {/* 畫出九宮格底圖 */}
        {renderCells()}

        {/* 畫出球的軌跡點 */}
        {pitches.map((pitch, idx) => {
          // 判斷樣式：被修改的球(橘色)、好球(紅色)、壞球(綠色)
          let dotClass = "pitch-dot ";
          if (pitch.isModified) dotClass += "cf-dot";
          else if (pitch.isStrike) dotClass += "strike-dot";
          else dotClass += "ball-dot";

          return (
            <div
              key={idx}
              className={dotClass}
              style={{
                left: `${pitch.x}%`,
                top: `${pitch.y}%`,
                opacity: pitch.opacity || 1, // 支援半透明歷史軌跡
              }}
            >
              {pitch.num}
            </div>
          );
        })}
      </div>
    </div>
  );
}
