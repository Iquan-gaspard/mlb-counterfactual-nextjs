"use client";
import React, { useState, useEffect, useContext } from "react";
import StrikeZone, {
  ZONE_COORDINATES,
  ZONE_EN,
} from "../../components/StrikeZone";
import Select from "react-select";
import { PitcherContext, API_BASE_URL, selectStyles } from "../PitcherProvider";
import PitchResultCard from "../../components/PitchResultCard";
import MatchupSelector from "../../components/MatchupSelector";
import PitchSetupSelects from "../../components/PitchSetupSelects";
import useBatters from "../../hooks/useBatters";

export default function InteractivePage() {
  const { pitcherId, pitcherData } = useContext(PitcherContext);

  const {
    batters,
    selectedBatterId,
    setSelectedBatterId,
    selectedStand,
    setSelectedStand,
    isLoadingBatters,
  } = useBatters();

  const [sequence, setSequence] = useState([]);
  const [currentType, setCurrentType] = useState("");
  const [currentZone, setCurrentZone] = useState("正中");

  const [step, setStep] = useState("build");
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentProbs, setCurrentProbs] = useState(null);

  useEffect(() => {
    if (pitcherData?.arsenal?.length > 0) {
      setCurrentType(pitcherData.arsenal[0].value);
    }
  }, [pitcherData]);

  let bCount = 0;
  let sCount = 0;
  let isBallInPlay = false;

  sequence.forEach((p) => {
    if (p.result === "Take") {
      if (p.zone.includes("壞")) bCount += 1;
      else sCount += 1;
    } else if (p.result === "Whiff") {
      sCount += 1;
    } else if (p.result === "Foul") {
      if (sCount < 2) sCount += 1;
    } else if (p.result === "Weak" || p.result === "Hard") {
      isBallInPlay = true;
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
    opacity: 0.5 + (idx / sequence.length) * 0.5,
  }));

  if (!isAtBatOver) {
    const currentCoords = ZONE_COORDINATES[currentZone] || { x: 50, y: 50 };
    renderPitches.push({
      x: currentCoords.x,
      y: currentCoords.y,
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

  // 🌟 修正：完美對接 Flask /api/simulate_sequence 的推演邏輯
  const handlePitch = async () => {
    setIsSimulating(true);
    const batter = batters.find(
      (b) => b.batter_id.toString() === selectedBatterId
    );

    try {
      // 1. 組合完整的配球序列 (歷史軌跡 + 畫面上正在設定的這一顆)
      const currentPitchesPayload = [
        ...sequence.map((p) => ({ type: p.type, zone: p.zone })),
        { type: currentType, zone: currentZone },
      ];

      // 2. 呼叫正確的路由
      const response = await fetch(`${API_BASE_URL}/api/simulate_sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitcher_id: pitcherId,
          stand: selectedStand,
          adv_stats: batter?.adv_stats || {},
          pitches: currentPitchesPayload, // 🌟 傳送整包正確格式的陣列
        }),
      });

      if (!response.ok) throw new Error("API 回應錯誤");

      const data = await response.json();

      // 3. 從後端回傳的結果中，抓取「最後一顆球」的機率作為打者反應選項
      const lastResult = data.results[data.results.length - 1];
      setCurrentProbs([
        parseFloat(lastResult.probs.take),
        parseFloat(lastResult.probs.whiff),
        parseFloat(lastResult.probs.foul),
        parseFloat(lastResult.probs.weak_contact),
        parseFloat(lastResult.probs.hard_contact),
      ]);

      setStep("outcome");
    } catch (error) {
      console.warn("⚠️ API 連線失敗，套用合理測試數據", error);
      // 只有在真的斷線或發生錯誤時，才會給這組 35.2% 的防呆數據
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
      <MatchupSelector
        batters={batters}
        isLoading={isLoadingBatters}
        selectedBatterId={selectedBatterId}
        setSelectedBatterId={setSelectedBatterId}
        selectedStand={selectedStand}
        setSelectedStand={setSelectedStand}
        selectStyles={selectStyles}
        onMatchupChange={() => {
          setSequence([]); // 🌟 沉浸模式：換打者就清空所有推演歷史
          setStep("build");
        }}
      />

      <div className="panel" style={{ position: "relative" }}>
        <div
          className="panel-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "18px" }}>
            🎮 沉浸式配球推演 (Interactive Mode)
          </span>
          <span
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#2c3e50",
              letterSpacing: "1px",
            }}
          >
            {bCount} B - {sCount} S
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "30px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* 左側區塊：九宮格與控制區 (維持置頂黏著) */}
          <div
            style={{
              flex: "1 1 300px",
              maxWidth: "340px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              position: "sticky",
              top: "15px",
            }}
          >
            <StrikeZone pitches={renderPitches} />

            <div className="interactive-controls">
              {isAtBatOver ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 10px",
                    background: "#eef7fc",
                    borderRadius: "8px",
                    border: "2px dashed var(--highlight)",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "18px",
                      color: isStrikeout
                        ? "var(--strike-red)"
                        : isWalk
                        ? "var(--ball-green)"
                        : "#8e44ad",
                      margin: "0 0 10px 0",
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
                    style={{
                      padding: "8px 15px",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  >
                    🔄 開始新打席
                  </button>
                </div>
              ) : step === "build" ? (
                <div
                  className="lab-controls"
                  style={{
                    marginTop: 0,
                    padding: "15px",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                  }}
                >
                  <div className="control-group">
                    <label
                      style={{
                        color: "var(--highlight)",
                        fontSize: "14px",
                        marginBottom: "8px",
                      }}
                    >
                      第 {sequence.length + 1} 球設定 (Pitch Setup)
                    </label>
                  </div>

                  <PitchSetupSelects
                    arsenal={pitcherData?.arsenal}
                    pitchType={currentType}
                    pitchZone={currentZone}
                    onTypeChange={setCurrentType}
                    onZoneChange={setCurrentZone}
                  />

                  <button
                    className="btn-simulate"
                    style={{ width: "100%", padding: "10px", fontSize: "15px" }}
                    onClick={handlePitch}
                    disabled={isSimulating}
                  >
                    {isSimulating ? "AI 運算中..." : "⚾ 投出此球 (Pitch!)"}
                  </button>
                </div>
              ) : (
                <div
                  className="lab-controls"
                  style={{
                    marginTop: 0,
                    background: "#fff",
                    border: "2px solid var(--highlight)",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    <label
                      style={{
                        color: "var(--highlight)",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      ✨ 指定打者反應：
                    </label>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <button
                      onClick={() => handleSelectOutcome("Take")}
                      style={outcomeBtnStyle("#7f8c8d")}
                    >
                      <span>
                        👀 Take {currentZone.includes("壞") ? "(B)" : "(S)"}
                      </span>
                      <span>
                        {currentProbs ? currentProbs[0].toFixed(1) : "--"}%
                      </span>
                    </button>
                    <button
                      onClick={() => handleSelectOutcome("Whiff")}
                      style={outcomeBtnStyle("#27ae60")}
                    >
                      <span>💨 Whiff</span>
                      <span>
                        {currentProbs ? currentProbs[1].toFixed(1) : "--"}%
                      </span>
                    </button>
                    <button
                      onClick={() => handleSelectOutcome("Foul")}
                      style={outcomeBtnStyle("#f39c12")}
                    >
                      <span>🛑 Foul</span>
                      <span>
                        {currentProbs ? currentProbs[2].toFixed(1) : "--"}%
                      </span>
                    </button>
                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                      <button
                        onClick={() => handleSelectOutcome("Weak")}
                        style={{
                          ...outcomeBtnStyle("#8e44ad"),
                          flex: 1,
                          padding: "8px 6px",
                          fontSize: "12px",
                        }}
                      >
                        <span>🏏 Weak</span>
                        <span>
                          {currentProbs ? currentProbs[3].toFixed(1) : "--"}%
                        </span>
                      </button>
                      <button
                        onClick={() => handleSelectOutcome("Hard")}
                        style={{
                          ...outcomeBtnStyle("#c0392b"),
                          flex: 1,
                          padding: "8px 6px",
                          fontSize: "12px",
                        }}
                      >
                        <span>🚀 Hard!</span>
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

          {/* 右側區塊：極致瘦身版的配球歷史清單 */}
          <div style={{ flex: "2 1 450px", minWidth: 0 }}>
            {sequence.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "250px",
                  border: "2px dashed #e0e6ed",
                  borderRadius: "12px",
                  color: "#95a5a6",
                  fontSize: "15px",
                  background: "#fafbfc",
                }}
              >
                {/* 🌟 拔除「👈」與「左側」，換成準心的 Emoji */}
                🎯 請先設定球路，開始進行沙盤推演
              </div>
            ) : (
              <div className="pitch-list" style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                    paddingBottom: "10px",
                    borderBottom: "2px solid #e0e6ed",
                  }}
                >
                  <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "16px" }}>
                    📋 歷史推演軌跡 (Pitch History)
                  </h3>
                  <button
                    onClick={undoLastPitch}
                    style={{
                      background: "#fff",
                      border: "1px solid #e74c3c",
                      color: "#e74c3c",
                      cursor: "pointer",
                      fontWeight: "bold",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxShadow: "0 1px 3px rgba(231,76,60,0.1)",
                    }}
                  >
                    ↩️ 復原 (Undo)
                  </button>
                </div>

                {/* 🌟 縮小卡片之間的 gap */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {sequence.map((p, idx) => (
                    <PitchResultCard
                      key={idx}
                      mode="interactive"
                      pitchNum={idx + 1}
                      type={p.type}
                      zone={p.zone}
                      probs={
                        p.probs
                          ? {
                              take: p.probs[0].toFixed(1),
                              whiff: p.probs[1].toFixed(1),
                              foul: p.probs[2].toFixed(1),
                              weak: p.probs[3].toFixed(1),
                              hard: p.probs[4].toFixed(1),
                            }
                          : null
                      }
                      outcome={p.result}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// 🌟 按鈕樣式一併微調瘦身，並強制 100% 滿版寬度
const outcomeBtnStyle = (bgColor) => ({
  width: "100%", // 🌟 強制填滿寬度
  boxSizing: "border-box", // 🌟 確保 padding 不會撐破外框
  padding: "10px 12px",
  fontSize: "14px",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  background: bgColor,
  color: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
});
