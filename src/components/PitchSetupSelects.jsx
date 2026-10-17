import React from "react";
import { ZONE_COORDINATES, ZONE_EN } from "./StrikeZone";

export default function PitchSetupSelects({
  mode = "interactive",
  arsenal,
  pitchType,
  pitchZone,
  onTypeChange,
  onZoneChange,
}) {
  // ==========================================
  // 自動推演模式 (Builder)：左右並排、無標題
  // ==========================================
  if (mode === "builder") {
    return (
      <>
        <select
          style={{
            width: "45%",
            minWidth: 0,
            padding: "6px",
            fontSize: "12px",
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

        <select
          style={{
            width: "55%",
            minWidth: 0,
            padding: "6px",
            fontSize: "12px",
          }}
          value={pitchZone}
          onChange={(e) => onZoneChange(e.target.value)}
        >
          {Object.keys(ZONE_COORDINATES).map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace("壞_", "壞_ ")} ({ZONE_EN[zone]})
            </option>
          ))}
        </select>
      </>
    );
  }

  // ==========================================
  // 沉浸互動模式 (Interactive)：上下疊加、有標題
  // ==========================================
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "15px",
      }}
    >
      <div className="control-group" style={{ width: "100%" }}>
        <label style={{ fontSize: "13px" }}>選擇球種 (Pitch Type)</label>
        <select
          value={pitchType}
          onChange={(e) => onTypeChange(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          {arsenal?.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="control-group" style={{ width: "100%" }}>
        <label style={{ fontSize: "13px" }}>進壘位置 (Location)</label>
        <select
          value={pitchZone}
          onChange={(e) => onZoneChange(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          {Object.keys(ZONE_COORDINATES).map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace("壞_", "壞_ ")} ({ZONE_EN[zone]})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
