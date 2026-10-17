import React, { useState, useEffect } from "react";
import Select from "react-select";

export default function MatchupSelector({
  batters,
  isLoading,
  selectedBatterId,
  setSelectedBatterId,
  selectedStand,
  setSelectedStand,
  selectStyles,
  onMatchupChange,
}) {
  const batterOptions = batters.map((b) => ({
    value: b.batter_id.toString(),
    label: b.label,
  }));

  // 🌟 加入 isMounted 狀態，確保 Next.js SSR 渲染時不會因為找不到 document 而報錯
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    // 🌟 利用 flexWrap: "wrap" 讓元素在手機版自動變成上下堆疊，釋放寬度
    <div
      className="controls"
      style={{
        marginBottom: "20px",
        display: "flex",
        gap: "15px",
        flexWrap: "wrap",
        overflow: "visible",
      }}
    >
      {/* 打者選擇區塊 */}
      <div
        style={{
          flex: "1 1 250px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <strong style={{ fontSize: "15px", color: "#555" }}>
          對戰打者 (Batter)：
        </strong>
        <div style={{ width: "100%" }}>
          <Select
            instanceId="batter-select"
            value={
              batterOptions.find((opt) => opt.value === selectedBatterId) ||
              null
            }
            onChange={(selectedOption) => {
              const bId = selectedOption.value;
              setSelectedBatterId(bId);
              const batter = batters.find(
                (b) => b.batter_id.toString() === bId
              );
              if (batter) setSelectedStand(batter.stand);
              if (onMatchupChange) onMatchupChange();
            }}
            options={batterOptions}
            isLoading={isLoading}
            isSearchable={true}
            placeholder="搜尋打者 (Search)..."
            styles={{
              ...selectStyles,
              // 確保出竅後的選單層級在最上層
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            // 🌟 終極破框魔法：讓選單渲染在 body 標籤上，無視任何父層的 overflow: hidden
            menuPortalTarget={isMounted ? document.body : null}
            menuPosition="fixed"
          />
        </div>
      </div>

      {/* 站位選擇區塊 */}
      <div
        style={{
          flex: "1 1 120px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <strong style={{ fontSize: "15px", color: "#555" }}>
          站位 (Stand)：
        </strong>
        <select
          value={selectedStand}
          onChange={(e) => {
            setSelectedStand(e.target.value);
            if (onMatchupChange) onMatchupChange();
          }}
          style={{
            width: "100%",
            padding: "9px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: "#fff",
            outline: "none",
          }}
        >
          <option value="R">右打 (Right)</option>
          <option value="L">左打 (Left)</option>
        </select>
      </div>
    </div>
  );
}
