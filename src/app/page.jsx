"use client";
import React, { useState, useEffect, useContext } from "react";
import StrikeZone, {
  ZONE_COORDINATES,
  ZONE_EN,
} from "../components/StrikeZone";
import Select from "react-select";
import { PitcherContext, API_BASE_URL, selectStyles } from "./PitcherProvider";

export default function HistoryPage() {
  // 🌟 從全域 Context 取得投手資料，取代原本的 props
  const { pitcherId, pitcherData } = useContext(PitcherContext);

  const [atBats, setAtBats] = useState([]);
  const [selectedAbId, setSelectedAbId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [simMode, setSimMode] = useState("last");
  const [newPitchType, setNewPitchType] = useState("");
  const [newPitchZone, setNewPitchZone] = useState("正中");
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!pitcherId) return;
    async function fetchAtBats() {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/atbats/${pitcherId}`);
        const data = await response.json();
        setAtBats(data);
        if (data.length > 0) setSelectedAbId(data[0].ab_id);
        else setSelectedAbId("");
        setSimResult(null);
      } catch (error) {
        console.error("無法載入打席:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAtBats();

    if (pitcherData?.arsenal?.length > 0) {
      setNewPitchType(pitcherData.arsenal[0].value);
    }
  }, [pitcherId, pitcherData]);

  const abOptions = atBats.map((ab) => ({ value: ab.ab_id, label: ab.label }));
  const currentAb = atBats.find((ab) => ab.ab_id === selectedAbId);
  const currentSequence = currentAb ? currentAb.sequence : [];

  let renderPitches = currentSequence.map((p) => ({
    ...p,
    isModified: false,
    opacity: 1,
  }));

  if (currentSequence.length > 0) {
    const isLast = currentSequence.length - 1;
    const isSecondLast = currentSequence.length - 2;
    const coords = ZONE_COORDINATES[newPitchZone] || { x: 50, y: 50 };

    if (simMode === "last") {
      renderPitches.forEach((p, idx) => {
        if (idx !== isLast) p.opacity = 0.3;
        if (idx === isLast) {
          p.x = coords.x;
          p.y = coords.y;
          p.isModified = true;
          p.name = newPitchType;
        }
      });
    } else if (simMode === "second_last" && currentSequence.length >= 2) {
      renderPitches.forEach((p, idx) => {
        if (idx < isSecondLast) p.opacity = 0.3;
        if (idx === isSecondLast) {
          p.x = coords.x;
          p.y = coords.y;
          p.isModified = true;
          p.name = newPitchType;
        }
      });
    }
  }

  const runSimulation = async () => {
    if (simMode === "second_last" && currentSequence.length < 2) {
      alert("此打席只有一球，無法改變佈局球 (N-1)！");
      setSimMode("last");
      return;
    }
    setIsSimulating(true);

    const getPhys = (pitchObj) => ({
      speed: parseFloat(pitchObj.raw_speed) / 100.0,
      px: pitchObj.raw_px,
      pz: pitchObj.raw_pz,
      pfx_x: pitchObj.raw_pfx_x,
      pfx_z: pitchObj.raw_pfx_z,
    });

    let n2_data = { speed: 0.95, px: 0, pz: 0, pfx_x: 0, pfx_z: 0 };
    let n1_data = { speed: 0.95, px: 0, pz: 0, pfx_x: 0, pfx_z: 0 };
    let orig_data = { speed: 0.95, px: 0, pz: 0, pfx_x: 0, pfx_z: 0 };
    let n1_out = [1, 0, 0];

    const len = currentSequence.length;
    if (len >= 3) n2_data = getPhys(currentSequence[len - 3]);
    if (len >= 2) {
      const n1 = currentSequence[len - 2];
      n1_data = getPhys(n1);
      const res = n1.result;
      const isTake = [
        "called_strike",
        "ball",
        "blocked_ball",
        "pitchout",
      ].includes(res)
        ? 1
        : 0;
      const isWhiff = [
        "swinging_strike",
        "swinging_pitchout",
        "swinging_strike_blocked",
        "foul_tip",
      ].includes(res)
        ? 1
        : 0;
      const isFoul = ["foul", "foul_bunt"].includes(res) ? 1 : 0;
      n1_out = [isTake, isWhiff, isFoul];
    }
    let bCount = 0,
      sCount = 0;
    if (len >= 1) {
      orig_data = getPhys(currentSequence[len - 1]);
      const parts = currentSequence[len - 1].count.split("-");
      if (parts.length === 2) {
        bCount = parseInt(parts[0].trim());
        sCount = parseInt(parts[1].trim());
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitcher_id: pitcherId,
          sim_mode: simMode,
          pitch_type: newPitchType,
          pitch_zone: newPitchZone,
          stand: currentAb.stand,
          adv_stats: currentAb.adv_stats,
          b_count: bCount,
          s_count: sCount,
          n2_pitch: n2_data,
          n1_pitch: n1_data,
          n1_outcome: n1_out,
          orig_pitch: orig_data,
        }),
      });
      if (!response.ok) throw new Error("伺服器回應錯誤");
      const result = await response.json();
      setSimResult(result);
    } catch (error) {
      console.error(error);
      alert("模擬失敗，請檢查後端是否正常運作！");
    } finally {
      setIsSimulating(false);
    }
  };

  const renderMetric = (label, emoji, idx, isPitcherFriendly) => {
    const origVal = simResult ? simResult.orig_probs[idx] : "--";
    const newVal = simResult ? simResult.cf_probs[idx] : "--";
    let colorClass = "";
    if (simResult && isPitcherFriendly !== null) {
      if (isPitcherFriendly && newVal > origVal) colorClass = "val-improve";
      else if (!isPitcherFriendly && newVal < origVal)
        colorClass = "val-improve";
      else colorClass = "val-worsen";
    }
    return (
      <div className="metric-card" key={idx}>
        <div className="metric-title">
          {emoji} {label}
        </div>
        <div className="metric-comparison">
          {simResult && <span className="val-original">{origVal}%</span>}
          <span className={`val-new ${colorClass}`}>
            {newVal}
            {simResult ? "%" : ""}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="controls"
        style={{
          marginBottom: "20px",
          background: "transparent",
          boxShadow: "none",
          padding: "0 25px",
          alignItems: "center",
        }}
      >
        <strong
          style={{ fontSize: "16px", color: "#555", whiteSpace: "nowrap" }}
        >
          選擇實戰打席 (Select At-Bat)：
        </strong>
        <div style={{ flex: 1 }}>
          <Select
            value={abOptions.find((opt) => opt.value === selectedAbId) || null}
            onChange={(selectedOption) => {
              setSelectedAbId(selectedOption.value);
              setSimResult(null);
            }}
            options={abOptions}
            isLoading={isLoading}
            isSearchable={true}
            placeholder="搜尋打者或日期 (Search Batter/Date)..."
            noOptionsMessage={() => "無符合條件的打席 (No matching at-bats)"}
            styles={selectStyles}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">實戰紀錄 (Original Sequence)</div>
        <div className="at-bat-view">
          <StrikeZone pitches={currentSequence} />
          <div className="pitch-list">
            {currentSequence.map((pitch, idx) => (
              <div
                key={idx}
                className={`pitch-item ${pitch.isStrike ? "strike" : "ball"}`}
              >
                <div className="pitch-number">{pitch.num}</div>
                <div className="pitch-info">
                  <div className="pitch-result">
                    {pitch.result}
                    {pitch.result === "hit_into_play" && pitch.launch_speed && (
                      <span
                        style={{
                          color: "#e74c3c",
                          fontSize: "0.9em",
                          fontWeight: "bold",
                          marginLeft: "6px",
                        }}
                      >
                        🚀 EV: {pitch.launch_speed}
                      </span>
                    )}
                  </div>
                  <div className="pitch-details">
                    <strong>{pitch.speed}</strong> {pitch.name}
                  </div>
                </div>
                <div className="pitch-count">{pitch.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ color: "var(--highlight)" }}>
          反事實實驗室 (Counterfactual Lab) - 決戰球 (Putaway) / 佈局球 (Setup)
        </div>
        <div className="at-bat-view">
          <StrikeZone pitches={renderPitches} />
          <div style={{ flex: 1 }}>
            <div className="lab-controls">
              <div className="control-group">
                <label style={{ color: "var(--highlight)" }}>
                  戰術選擇 (Strategy)
                </label>
                <select
                  value={simMode}
                  onChange={(e) => {
                    setSimMode(e.target.value);
                    setSimResult(null);
                  }}
                >
                  <option value="last">改變決戰球 (Putaway Pitch - N)</option>
                  <option value="second_last">
                    改變佈局球 (Setup Pitch - N-1)
                  </option>
                </select>
              </div>
              <div className="control-group">
                <label>改變球種 (Pitch Type)</label>
                <select
                  value={newPitchType}
                  onChange={(e) => setNewPitchType(e.target.value)}
                >
                  {pitcherData?.arsenal?.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-group">
                <label>進壘位置 (Location)</label>
                <select
                  value={newPitchZone}
                  onChange={(e) => setNewPitchZone(e.target.value)}
                >
                  {Object.keys(ZONE_COORDINATES).map((zone) => (
                    <option key={zone} value={zone}>
                      {zone.replace("壞_", "壞_ ")} ({ZONE_EN[zone]})
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-simulate"
                onClick={runSimulation}
                disabled={isSimulating || currentSequence.length === 0}
              >
                {isSimulating
                  ? "運算中 (Simulating)..."
                  : "重新模擬 (Re-Simulate)"}
              </button>
            </div>
            <div className="metrics-grid">
              {renderMetric("不揮棒 (Take)", "👀", 0, null)}
              {renderMetric("揮空 (Whiff)", "💨", 1, true)}
              {renderMetric("界外 (Foul)", "🛑", 2, true)}
              {renderMetric("弱擊球 (Weak Contact)", "🏏", 3, true)}
              {renderMetric("強擊球 (Hard Hit)", "🚀", 4, false)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
