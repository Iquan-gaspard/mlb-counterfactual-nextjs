"use client";
import React, { useState, useEffect, useContext } from "react";
import StrikeZone, {
  ZONE_COORDINATES,
  ZONE_EN,
} from "../components/StrikeZone";
import Select from "react-select";
import { PitcherContext, selectStyles } from "./PitcherProvider";

export default function ActualAtBatPage() {
  const { pitcherId, pitcherData } = useContext(PitcherContext);

  const [atBats, setAtBats] = useState([]);
  const [selectedAtBatId, setSelectedAtBatId] = useState("");
  const [isLoadingAtBats, setIsLoadingAtBats] = useState(false);

  // 反事實實驗室狀態
  const [simMode, setSimMode] = useState("last"); // "last" 決戰球 | "setup" 佈局球
  const [currentType, setCurrentType] = useState("");
  const [currentZone, setCurrentZone] = useState("正中");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);

  // 預測機率結果 (不揮棒, 揮空, 界外, 弱擊, 強擊)
  const [cfProbs, setCfProbs] = useState(null);
  const [origProbs, setOrigProbs] = useState(null);

  // 1. 透過 BFF 取得該投手的實戰打席清單
  useEffect(() => {
    async function fetchAtBats() {
      if (!pitcherId) return;
      setIsLoadingAtBats(true);
      setAtBats([]);
      setSelectedAtBatId("");
      setIsSimulated(false);
      setCfProbs(null);
      setOrigProbs(null);

      try {
        const response = await fetch(`/api/atbats?pitcher_id=${pitcherId}`);
        if (!response.ok) throw new Error("取得實戰打席失敗");
        const data = await response.json();
        setAtBats(data);
        if (data && data.length > 0) {
          setSelectedAtBatId(data[0].ab_id);
        }
      } catch (error) {
        console.error("無法載入實戰打席：", error);
      } finally {
        setIsLoadingAtBats(false);
      }
    }

    fetchAtBats();
  }, [pitcherId]);

  // 當投手球種庫載入時，設定預設球種
  useEffect(() => {
    if (pitcherData?.arsenal?.length > 0) {
      setCurrentType(pitcherData.arsenal[0].value);
    }
  }, [pitcherData]);

  // 當前選中的打席資料
  const currentAtBat =
    atBats.find((ab) => ab.ab_id === selectedAtBatId) || atBats[0];

  // 2. 執行反事實推演 (呼叫 Next.js 同源 BFF 代理)
  const handleReSimulate = async () => {
    if (
      !currentAtBat ||
      !currentAtBat.sequence ||
      currentAtBat.sequence.length < 2
    ) {
      alert("此打席球數不足以進行反事實推演");
      return;
    }

    setIsSimulating(true);

    try {
      // 🌟 前端只需要傳遞決策參數，不再傳送任何原始座標或 sequence 陣列！
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitcher_id: pitcherId,
          ab_id: currentAtBat.ab_id,
          sim_mode: simMode,
          pitch_type: currentType,
          pitch_zone: currentZone,
        }),
      });

      if (!response.ok) {
        throw new Error(`模擬失敗: HTTP ${response.status}`);
      }

      const result = await response.json();
      setCfProbs(result.cf_probs);
      setOrigProbs(result.orig_probs);
      setIsSimulated(true);
    } catch (error) {
      console.error("反事實模擬出錯：", error);
      alert("模擬推演失敗，請確認後端服務連線正常");
    } finally {
      setIsSimulating(false);
    }
  };

  // 3. 準備九宮格渲染資料 (若是反事實模擬球，給予黃色光暈標記)
  const renderPitches = currentAtBat?.sequence
    ? currentAtBat.sequence.map((p, idx) => {
        const isTarget =
          (simMode === "last" && idx === currentAtBat.sequence.length - 1) ||
          (simMode === "setup" && idx === currentAtBat.sequence.length - 2);

        if (isTarget && isSimulated) {
          const coords = ZONE_COORDINATES[currentZone] || { x: 50, y: 50 };
          return {
            x: coords.x,
            y: coords.y,
            num: p.num,
            isStrike: !currentZone.includes("壞"),
            isModified: true, // 帶有黃色高亮光暈
            opacity: 1,
          };
        }

        return {
          x: p.x,
          y: p.y,
          num: p.num,
          isStrike: p.isStrike,
          isModified: isTarget,
          opacity: isTarget ? 1 : 0.6,
        };
      })
    : [];

  const atBatOptions = atBats.map((ab) => ({
    value: ab.ab_id,
    label: ab.label,
  }));

  return (
    <>
      {/* 實戰打席下拉選單 */}
      <div
        className="controls"
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <strong
          style={{ fontSize: "15px", color: "#555", whiteSpace: "nowrap" }}
        >
          選擇實戰打席 (Select At-Bat)：
        </strong>
        <div style={{ flex: 1 }}>
          <Select
            instanceId="atbat-select"
            value={
              atBatOptions.find((opt) => opt.value === selectedAtBatId) || null
            }
            onChange={(opt) => {
              setSelectedAtBatId(opt.value);
              setIsSimulated(false);
              setCfProbs(null);
              setOrigProbs(null);
            }}
            options={atBatOptions}
            isLoading={isLoadingAtBats}
            isSearchable={true}
            placeholder="搜尋打者或日期 (Search)..."
            styles={selectStyles}
          />
        </div>
      </div>

      {/* 上半部：實戰紀錄 */}
      <div className="panel" style={{ marginBottom: "25px" }}>
        <div
          className="panel-header"
          style={{ fontSize: "18px", color: "#2c3e50" }}
        >
          實戰紀錄 (Original Sequence)
        </div>
        <div
          style={{
            display: "flex",
            gap: "30px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 300px", maxWidth: "340px" }}>
            <StrikeZone pitches={renderPitches} />
          </div>

          <div style={{ flex: "2 1 450px", minWidth: 0 }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {currentAtBat?.sequence?.map((p, idx) => (
                <div
                  key={idx}
                  className="pitch-item modified"
                  style={{
                    borderColor: p.isStrike ? "#c0392b" : "#27ae60",
                    background: "#fff",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      className="pitch-number"
                      style={{
                        background: p.isStrike ? "#c0392b" : "#27ae60",
                        width: "26px",
                        height: "26px",
                        fontSize: "13px",
                      }}
                    >
                      {p.num}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#333",
                          fontWeight: "bold",
                        }}
                      >
                        {p.result}{" "}
                        {p.launch_speed && (
                          <span style={{ color: "#e67e22", fontSize: "13px" }}>
                            🚀 EV: {p.launch_speed}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: "#666" }}>
                        {p.speed} {p.type}
                      </div>
                    </div>
                  </div>
                  <strong
                    style={{
                      fontSize: "16px",
                      color: "#2c3e50",
                      letterSpacing: "1px",
                    }}
                  >
                    {p.count}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 下半部：反事實實驗室 (Counterfactual Lab) */}
      <div className="panel">
        <div
          className="panel-header"
          style={{ fontSize: "18px", color: "var(--highlight)" }}
        >
          反事實實驗室 (Counterfactual Lab) - 決戰球 (Putaway) / 佈局球 (Setup)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 控制表單 */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
              flexWrap: "wrap",
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <div style={{ flex: "1 1 200px" }}>
              <label
                style={{
                  fontSize: "13px",
                  color: "var(--highlight)",
                  fontWeight: "bold",
                }}
              >
                戰術選擇 (Strategy)
              </label>
              <select
                value={simMode}
                onChange={(e) => {
                  setSimMode(e.target.value);
                  setIsSimulated(false);
                }}
                style={{ width: "100%", padding: "8px" }}
              >
                <option value="last">改變決戰球 (Putaway Pitch - N)</option>
                <option value="setup">改變佈局球 (Setup Pitch - N-1)</option>
              </select>
            </div>

            <div style={{ flex: "1 1 150px" }}>
              <label
                style={{ fontSize: "13px", color: "#555", fontWeight: "bold" }}
              >
                改變球種 (Pitch Type)
              </label>
              <select
                value={currentType}
                onChange={(e) => {
                  setCurrentType(e.target.value);
                  setIsSimulated(false);
                }}
                style={{ width: "100%", padding: "8px" }}
              >
                {pitcherData?.arsenal?.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 150px" }}>
              <label
                style={{ fontSize: "13px", color: "#555", fontWeight: "bold" }}
              >
                進壘位置 (Location)
              </label>
              <select
                value={currentZone}
                onChange={(e) => {
                  setCurrentZone(e.target.value);
                  setIsSimulated(false);
                }}
                style={{ width: "100%", padding: "8px" }}
              >
                {Object.keys(ZONE_COORDINATES).map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace("壞_", "壞_ ")} ({ZONE_EN[zone]})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 180px", alignSelf: "flex-end" }}>
              <button
                className="btn-simulate"
                style={{ width: "100%", padding: "10px", fontSize: "15px" }}
                onClick={handleReSimulate}
                disabled={isSimulating}
              >
                {isSimulating ? "AI 推演中..." : "重新模擬 (Re-Simulate)"}
              </button>
            </div>
          </div>

          {/* 5 種打擊結果機率對照卡片 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
            }}
          >
            <OutcomeCompareCard
              label="👀 不揮棒 (Take)"
              orig={origProbs?.[0]}
              cf={cfProbs?.[0]}
            />
            <OutcomeCompareCard
              label="💨 揮空 (Whiff)"
              orig={origProbs?.[1]}
              cf={cfProbs?.[1]}
            />
            <OutcomeCompareCard
              label="🛑 界外 (Foul)"
              orig={origProbs?.[2]}
              cf={cfProbs?.[2]}
            />
            <OutcomeCompareCard
              label="🏏 弱擊球 (Weak)"
              orig={origProbs?.[3]}
              cf={cfProbs?.[3]}
            />
            <OutcomeCompareCard
              label="🚀 強擊球 (Hard)"
              orig={origProbs?.[4]}
              cf={cfProbs?.[4]}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// 輔助卡片組件：清楚比對「原始真實機率」與「反事實推演機率」
function OutcomeCompareCard({ label, orig, cf }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e6ed",
        borderRadius: "8px",
        padding: "12px",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#555",
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      {cf !== undefined && orig !== undefined ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              color: "#95a5a6",
              textDecoration: "line-through",
            }}
          >
            {orig}%
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: cf > orig ? "#27ae60" : "#c0392b",
            }}
          >
            {cf}%
          </span>
        </div>
      ) : (
        <div style={{ fontSize: "16px", color: "#bdc3c7", fontWeight: "bold" }}>
          --
        </div>
      )}
    </div>
  );
}
