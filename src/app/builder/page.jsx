"use client";
import React, { useState, useEffect, useContext } from "react";
import StrikeZone, {
  ZONE_COORDINATES,
  ZONE_EN,
} from "../../components/StrikeZone";
import Select from "react-select";
import { PitcherContext, API_BASE_URL, selectStyles } from "../PitcherProvider";

export default function BuilderPage() {
  // 🌟 從全域 Context 取得資料
  const { pitcherId, pitcherData } = useContext(PitcherContext);

  const [batters, setBatters] = useState([]);
  const [selectedBatterId, setSelectedBatterId] = useState("");
  const [selectedStand, setSelectedStand] = useState("R");
  const [isLoading, setIsLoading] = useState(false);
  const [isModified, setIsModified] = useState(false);

  const [seqLength, setSeqLength] = useState(5);
  const [pitches, setPitches] = useState([]);
  const [simResults, setSimResults] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    async function fetchBatters() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/batters`);
        const data = await res.json();
        setBatters(data);
        if (data.length > 0) {
          setSelectedBatterId(data[0].batter_id.toString());
          setSelectedStand(data[0].stand);
        }
      } catch (e) {
        console.error("無法載入打者清單", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBatters();
  }, []);

  useEffect(() => {
    const defaultType = pitcherData?.arsenal?.[0]?.value || "FF";
    setPitches(
      Array.from({ length: seqLength }).map(() => ({
        type: defaultType,
        zone: "正中",
      }))
    );
    setSimResults([]);
  }, [seqLength, pitcherData]);

  const updatePitch = (index, field, value) => {
    const newPitches = [...pitches];
    newPitches[index][field] = value;
    setPitches(newPitches);
    setIsModified(true);
  };

  const runSequence = async () => {
    setIsSimulating(true);
    setIsModified(false);
    const batter = batters.find(
      (b) => b.batter_id.toString() === selectedBatterId
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate_sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitcher_id: pitcherId,
          stand: selectedStand,
          adv_stats: batter?.adv_stats || {},
          pitches: pitches,
        }),
      });
      if (!res.ok) throw new Error("API 運算錯誤");
      const data = await res.json();
      setSimResults(data.results);
    } catch (e) {
      console.error(e);
      alert("序列運算發生錯誤！");
    } finally {
      setIsSimulating(false);
    }
  };

  const renderPitches =
    simResults.length > 0
      ? simResults.map((r, idx) => {
          const coords = ZONE_COORDINATES[r.zone] || { x: 50, y: 50 };
          const isLast = idx === simResults.length - 1;
          return {
            x: coords.x,
            y: coords.y,
            num: r.pitch_num,
            isStrike: true,
            isModified: isLast,
            opacity: isLast ? 1 : 0.5,
          };
        })
      : [];

  const batterOptions = batters.map((b) => ({
    value: b.batter_id.toString(),
    label: b.label,
  }));

  return (
    <>
      <div
        className="controls"
        style={{ marginBottom: "20px", display: "flex", gap: "15px" }}
      >
        <div
          style={{
            flex: 2,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <strong
            style={{ fontSize: "16px", color: "#555", whiteSpace: "nowrap" }}
          >
            對戰打者 (Batter)：
          </strong>
          <div style={{ flex: 1 }}>
            <Select
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
                setSimResults([]);
              }}
              options={batterOptions}
              isLoading={isLoading}
              isSearchable={true}
              placeholder="搜尋打者 (Search Batter)..."
              styles={selectStyles}
            />
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <strong
            style={{ fontSize: "16px", color: "#555", whiteSpace: "nowrap" }}
          >
            站位 (Stand)：
          </strong>
          <select
            value={selectedStand}
            onChange={(e) => {
              setSelectedStand(e.target.value);
              setSimResults([]);
            }}
            style={{ width: "100%", padding: "9px", borderRadius: "6px" }}
          >
            <option value="R">右打 (Right)</option>
            <option value="L">左打 (Left)</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ color: "#e67e22" }}>
          連續配球腳本 (Sequence Builder) - 動態多球對決
        </div>
        <div className="at-bat-view">
          <StrikeZone pitches={renderPitches} />
          <div style={{ flex: 1 }}>
            <div
              className="lab-controls"
              style={{
                marginBottom: "10px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {/* 🌟 修改區塊：替換成加減按鈕控制器 */}
              <div
                className="control-group"
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <label
                  style={{ color: "#e67e22", fontWeight: "bold", margin: 0 }}
                >
                  配球數 (Pitches)
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSeqLength((prev) => Math.max(1, prev - 1))
                    }
                    disabled={seqLength <= 1}
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: seqLength <= 1 ? "#f3f4f6" : "#e5e7eb",
                      color: seqLength <= 1 ? "#9ca3af" : "#374151",
                      border: "none",
                      borderRadius: "50%",
                      fontSize: "18px",
                      fontWeight: "bold",
                      cursor: seqLength <= 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    -
                  </button>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      width: "24px",
                      textAlign: "center",
                      color: "#333",
                    }}
                  >
                    {seqLength}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSeqLength((prev) => Math.min(7, prev + 1))
                    }
                    disabled={seqLength >= 7}
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: seqLength >= 7 ? "#f3f4f6" : "#e5e7eb",
                      color: seqLength >= 7 ? "#9ca3af" : "#374151",
                      border: "none",
                      borderRadius: "50%",
                      fontSize: "18px",
                      fontWeight: "bold",
                      cursor: seqLength >= 7 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn-simulate"
                onClick={runSequence}
                disabled={isSimulating}
                style={{ backgroundColor: "#e67e22" }}
              >
                {isSimulating
                  ? "運算中 (Simulating)..."
                  : "執行序列 (Run Sequence)"}
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {pitches.map((p, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "25px",
                      height: "25px",
                      background: "#e67e22",
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <select
                    style={{ flex: 1 }}
                    value={p.type}
                    onChange={(e) => updatePitch(idx, "type", e.target.value)}
                  >
                    {pitcherData?.arsenal?.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    style={{ flex: 1 }}
                    value={p.zone}
                    onChange={(e) => updatePitch(idx, "zone", e.target.value)}
                  >
                    {Object.keys(ZONE_COORDINATES).map((zone) => (
                      <option key={zone} value={zone}>
                        {zone.replace("壞_", "壞_ ")} ({ZONE_EN[zone]})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div
              className="pitch-list"
              style={{
                opacity: isModified ? 0.5 : 1,
                transition: "opacity 0.3s",
              }}
            >
              {simResults.length === 0 ? (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    paddingLeft: "10px",
                  }}
                >
                  ℹ️ 請設定球數並選擇球種。系統將計算每顆球在「歷史殘影
                  Delta」影響下的逐球期望值。
                  <br />
                  (Set pitch types and locations. The model calculates expected
                  outcomes influenced by the historical sequence delta.)
                </div>
              ) : (
                simResults.map((r, idx) => (
                  <div
                    key={idx}
                    className="pitch-item modified"
                    style={{ borderColor: "#e67e22" }}
                  >
                    <div
                      className="pitch-number"
                      style={{ background: "#e67e22" }}
                    >
                      {r.pitch_num}
                    </div>
                    <div className="pitch-info" style={{ flex: 1 }}>
                      <div
                        className="pitch-result"
                        style={{ color: "#e67e22", marginBottom: "8px" }}
                      >
                        <strong>{r.type}</strong> ({r.zone})
                      </div>
                      <div className="badge-container">
                        <span className="badge badge-take">
                          👀 不揮棒 (Take) {r.probs.take}%
                        </span>
                        <span className="badge badge-whiff">
                          💨 揮空 (Whiff) {r.probs.whiff}%
                        </span>
                        <span className="badge badge-foul">
                          🛑 界外 (Foul) {r.probs.foul}%
                        </span>
                        <span className="badge badge-weak">
                          🏏 弱擊 (Weak) {r.probs.weak_contact}%
                        </span>
                        <span className="badge badge-hard">
                          🚀 強擊 (Hard Hit) {r.probs.hard_contact}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
