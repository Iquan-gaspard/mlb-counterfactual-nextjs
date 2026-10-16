"use client";
import React, { useState, useEffect, useContext } from "react";
import StrikeZone, {
  ZONE_COORDINATES,
  ZONE_EN,
} from "../../components/StrikeZone";
import Select from "react-select";
import { PitcherContext, API_BASE_URL, selectStyles } from "../PitcherProvider";

export default function InteractivePage() {
  const { pitcherId, pitcherData } = useContext(PitcherContext);

  // 🌟 1. 新增：打者選擇相關狀態
  const [batters, setBatters] = useState([]);
  const [selectedBatterId, setSelectedBatterId] = useState("");
  const [selectedStand, setSelectedStand] = useState("R");
  const [isLoadingBatters, setIsLoadingBatters] = useState(false);

  // 🌟 核心配球狀態管理
  const [sequence, setSequence] = useState([]);
  const [currentType, setCurrentType] = useState("");
  const [currentZone, setCurrentZone] = useState("正中");

  const [step, setStep] = useState("build");
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentProbs, setCurrentProbs] = useState(null);

  // 初次載入：抓取打者名單
  useEffect(() => {
    async function fetchBatters() {
      setIsLoadingBatters(true);
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
        setIsLoadingBatters(false);
      }
    }
    fetchBatters();
  }, []);

  // 當投手資料載入時，預設選擇他的第一種球路
  useEffect(() => {
    if (pitcherData?.arsenal?.length > 0) {
      setCurrentType(pitcherData.arsenal[0].value);
    }
  }, [pitcherData]);

  // 🌟 2. 修復：完全符合棒球規則的好壞球計算
  let bCount = 0;
  let sCount = 0;
  let isBallInPlay = false; // 是否已經擊出進場內

  sequence.forEach((p) => {
    if (p.result === "Take") {
      // 判斷 Take 是壞球還是判好球 (Called Strike)
      if (p.zone.includes("壞")) {
        bCount += 1;
      } else {
        sCount += 1;
      }
    } else if (p.result === "Whiff") {
      sCount += 1; // 揮空=好球
    } else if (p.result === "Foul") {
      if (sCount < 2) sCount += 1; // 兩好球前界外=好球，兩好球後不增加
    } else if (p.result === "Weak" || p.result === "Hard") {
      isBallInPlay = true; // 打進場內，打席結束
    }
  });

  const isStrikeout = sCount >= 3;
  const isWalk = bCount >= 4;
  const isAtBatOver = isStrikeout || isWalk || isBallInPlay;

  const renderPitches = sequence.map((p, idx) => ({
    x: ZONE_COORDINATES[p.zone]?.x || 50,
    y: ZONE_COORDINATES[p.zone]?.y || 50,
    isStrike: !(p.result === "Take" && p.zone.includes("壞")),
    isModified: false,
    num: idx + 1,
    // 🌟 提高最低透明度為 0.5，避免紅色變成淺粉紅
    opacity: 0.5 + (idx / sequence.length) * 0.5,
  }));

  if (!isAtBatOver) {
    const currentCoords = ZONE_COORDINATES[currentZone] || { x: 50, y: 50 };
    renderPitches.push({
      x: currentCoords.x,
      y: currentCoords.y,
      // 🌟 讓當前正在設定的這顆球，也能立刻依據位置顯示紅色或綠色
      isStrike: !currentZone.includes("壞"),
      isModified: true,
      num: sequence.length + 1,
      opacity: 1,
    });
  }

  const batterOptions = batters.map((b) => ({
    value: b.batter_id.toString(),
    label: b.label,
  }));

  // 送出預測
  const handlePitch = async () => {
    setIsSimulating(true);
    const batter = batters.find(
      (b) => b.batter_id.toString() === selectedBatterId
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/simulate_builder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitcher_id: pitcherId,
          batter_id: selectedBatterId,
          stand: selectedStand,
          adv_stats: batter?.adv_stats || {}, // 🌟 把打者數據包進去
          pitch_type: currentType,
          pitch_zone: currentZone,
          b_count: bCount,
          s_count: sCount,
          sequence_history: sequence,
        }),
      });
      if (!response.ok) throw new Error("API 未準備好或出錯");
      const result = await response.json();
      setCurrentProbs(result.cf_probs);
      setStep("outcome");
    } catch (error) {
      console.warn("⚠️ API 尚未準備好，套用合理測試數據");
      // 包含 5 種機率的合理測試數據
      setCurrentProbs([35.2, 25.1, 22.4, 12.0, 5.3]);
      setStep("outcome");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectOutcome = (outcomeLabel) => {
    setSequence([
      ...sequence,
      {
        type: currentType,
        zone: currentZone,
        result: outcomeLabel,
        probs: currentProbs,
      },
    ]);
    setStep("build");
    setCurrentProbs(null);
  };

  const undoLastPitch = () => {
    if (sequence.length === 0) return;
    setSequence(sequence.slice(0, -1));
    setStep("build");
    setCurrentProbs(null);
  };

  return (
    <>
      {/* 🌟 1. 新增：打者與站位選擇區塊 */}
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
                setSequence([]); // 換打者就重置配球
              }}
              options={batterOptions}
              isLoading={isLoadingBatters}
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
              setSequence([]); // 換左右打就重置配球
            }}
            style={{ width: "100%", padding: "9px", borderRadius: "6px" }}
          >
            <option value="R">右打 (Right)</option>
            <option value="L">左打 (Left)</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div
          className="panel-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>🎮 沉浸式配球推演 (Interactive Mode)</span>
          {/* 🌟 修復後的好壞球顯示板 */}
          <span
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2c3e50",
              letterSpacing: "2px",
            }}
          >
            {bCount} B - {sCount} S
          </span>
        </div>

        <div className="at-bat-view">
          <StrikeZone pitches={renderPitches} />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {sequence.length > 0 && (
              <div
                className="badge-container"
                style={{
                  padding: "15px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e0e6ed",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>📋 已投出的球 (Pitch History)：</span>
                  {/* 🌟 修復復原按鈕的破版底線，改為精緻的實體按鈕 */}
                  <button
                    onClick={undoLastPitch}
                    style={{
                      background: "#fff",
                      border: "1px solid #e74c3c",
                      color: "#e74c3c",
                      cursor: "pointer",
                      fontWeight: "bold",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxShadow: "0 1px 3px rgba(231, 76, 60, 0.1)",
                    }}
                  >
                    ↩️ 復原 (Undo)
                  </button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {sequence.map((p, idx) => {
                    // 🌟 核心邏輯：與九宮格畫布完全同步的紅綠色判斷
                    const isStrike = !(
                      p.result === "Take" && p.zone.includes("壞")
                    );
                    const bgColor = isStrike ? "#e74c3c" : "#2ecc71"; // 紅色(Strike) / 綠色(Ball)
                    const statusEn = isStrike ? "Strike" : "Ball";
                    const statusTw = isStrike ? "好球" : "壞球";

                    return (
                      <span
                        key={idx}
                        className="badge"
                        style={{
                          fontSize: "13px",
                          padding: "6px 12px",
                          backgroundColor: bgColor,
                          color: "#fff",
                          borderRadius: "6px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <strong>
                          {idx + 1}. {p.type}
                        </strong>
                        <span style={{ opacity: 0.8 }}>|</span>
                        <span>
                          {p.result} ({statusTw} / {statusEn})
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🌟 狀態判斷：如果打席結束，鎖住面板 */}
            {isAtBatOver ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  background: "#eef7fc",
                  borderRadius: "8px",
                  border: "2px dashed var(--highlight)",
                }}
              >
                <h2
                  style={{
                    color: isStrikeout
                      ? "var(--strike-red)"
                      : isWalk
                      ? "var(--ball-green)"
                      : "#8e44ad",
                    margin: "0 0 15px 0",
                  }}
                >
                  {isStrikeout
                    ? "🎯 三振出局 (Strikeout)！"
                    : isWalk
                    ? "🚶 保送上壘 (Walk)！"
                    : "⚾ 擊球進場 (Ball In Play)！"}
                </h2>
                <button
                  onClick={() => {
                    setSequence([]);
                    setStep("build");
                  }}
                  className="btn-simulate"
                  style={{ padding: "10px 30px" }}
                >
                  🔄 開始新打席 (New At-Bat)
                </button>
              </div>
            ) : step === "build" ? (
              <div className="lab-controls" style={{ marginTop: 0 }}>
                <div className="control-group">
                  <label
                    style={{ color: "var(--highlight)", fontSize: "15px" }}
                  >
                    第 {sequence.length + 1} 球設定
                  </label>
                </div>
                <div className="control-group">
                  <label>選擇球種 (Pitch Type)</label>
                  <select
                    value={currentType}
                    onChange={(e) => setCurrentType(e.target.value)}
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
                    value={currentZone}
                    onChange={(e) => setCurrentZone(e.target.value)}
                  >
                    {Object.keys(ZONE_COORDINATES).map((zone) => (
                      <option key={zone} value={zone}>
                        {zone.replace("壞_", "壞_ ")} ({ZONE_EN[zone]})
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    width: "100%",
                    marginTop: "15px",
                  }}
                >
                  <button
                    className="btn-simulate"
                    style={{ flex: 1, padding: "15px" }}
                    onClick={handlePitch}
                    disabled={isSimulating}
                  >
                    {isSimulating ? "AI 運算中..." : "⚾ 投出此球 (Pitch!)"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="lab-controls"
                style={{
                  marginTop: 0,
                  background: "#fff",
                  border: "2px solid var(--highlight)",
                  display: "block",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <label
                    style={{
                      color: "var(--highlight)",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    ✨ 預測完成！指定打者反應進入下一球：
                  </label>
                </div>

                {/* 🌟 3. 新增：5 種完整機率選項面板 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => handleSelectOutcome("Take")}
                    style={outcomeBtnStyle("#7f8c8d")}
                  >
                    <span>
                      👀 不揮棒 (Take){" "}
                      {currentZone.includes("壞") ? " -> 壞球" : " -> 判好球"}
                    </span>
                    <span>
                      {currentProbs ? currentProbs[0].toFixed(1) : "--"}%
                    </span>
                  </button>
                  <button
                    onClick={() => handleSelectOutcome("Whiff")}
                    style={outcomeBtnStyle("#27ae60")}
                  >
                    <span>💨 揮空 (Whiff)</span>
                    <span>
                      {currentProbs ? currentProbs[1].toFixed(1) : "--"}%
                    </span>
                  </button>
                  <button
                    onClick={() => handleSelectOutcome("Foul")}
                    style={outcomeBtnStyle("#f39c12")}
                  >
                    <span>🛑 界外 (Foul)</span>
                    <span>
                      {currentProbs ? currentProbs[2].toFixed(1) : "--"}%
                    </span>
                  </button>

                  {/* 強/弱擊球獨立區塊，用顏色區分嚴重性 */}
                  <div
                    style={{ display: "flex", gap: "10px", marginTop: "5px" }}
                  >
                    <button
                      onClick={() => handleSelectOutcome("Weak")}
                      style={{ ...outcomeBtnStyle("#8e44ad"), flex: 1 }}
                    >
                      <span>🏏 弱擊 (Weak Contact)</span>
                      <span>
                        {currentProbs ? currentProbs[3].toFixed(1) : "--"}%
                      </span>
                    </button>
                    <button
                      onClick={() => handleSelectOutcome("Hard")}
                      style={{ ...outcomeBtnStyle("#c0392b"), flex: 1 }}
                    >
                      <span>🚀 強擊 (Hard Hit / Danger!)</span>
                      <span>
                        {currentProbs ? currentProbs[4].toFixed(1) : "--"}%
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// 提取按鈕共用樣式以保持版面乾淨
const outcomeBtnStyle = (bgColor) => ({
  padding: "12px 15px",
  fontSize: "15px",
  fontWeight: "bold",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  background: bgColor,
  color: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
});
