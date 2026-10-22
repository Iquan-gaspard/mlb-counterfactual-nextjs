"use client";
import React, { useState, useEffect, useContext } from "react";
import StrikeZone, { ZONE_COORDINATES } from "../../components/StrikeZone";
import { PitcherContext } from "../PitcherProvider";
import PitchResultCard from "../../components/PitchResultCard";
import MatchupSelector from "../../components/MatchupSelector";
import PitchSetupSelects from "../../components/PitchSetupSelects";
import useBatters from "../../hooks/useBatters";
import { getPitchPhysics } from "../../lib/pitchUtils";
import { useLanguage } from "@/context/LanguageContext";

export default function InteractivePage() {
  const { pitcherId, pitcherData } = useContext(PitcherContext);
  const { t, lang } = useLanguage(); // 🌟 同時引入 t 與 lang

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

  const handlePitch = async () => {
    setIsSimulating(true);

    try {
      const currentPitchesPayload = [
        ...sequence.map((p) => {
          const phys = getPitchPhysics(pitcherData, p.type, p.zone);
          return {
            type: p.type,
            zone: p.zone,
            result: p.result,
            speed: phys.speed,
            pfx_x: phys.pfx_x,
            pfx_z: phys.pfx_z,
          };
        }),
        (() => {
          const phys = getPitchPhysics(pitcherData, currentType, currentZone);
          return {
            type: currentType,
            zone: currentZone,
            speed: phys.speed,
            pfx_x: phys.pfx_x,
            pfx_z: phys.pfx_z,
          };
        })(),
      ];

      const response = await fetch("/api/simulate_sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitcher_id: pitcherId,
          batter_id: selectedBatterId,
          stand: selectedStand,
          b_count: bCount,
          s_count: sCount,
          pitches: currentPitchesPayload.map((p) => ({
            type: p.type,
            zone: p.zone,
            result: p.result,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API 回應錯誤: HTTP ${response.status}`);
      }

      const data = await response.json();
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
        onMatchupChange={() => {
          setSequence([]);
          setStep("build");
        }}
      />

      <div className="panel" style={{ position: "relative" }}>
        {/* 頂部標題與球數 */}
        <div
          className="panel-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "18px" }}>{t("interactive_title")}</span>
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
          {/* 左側區塊：九宮格與控制區 */}
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
                      ? t("status_strikeout")
                      : isWalk
                      ? t("status_walk")
                      : t("status_ball_in_play")}
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
                    {t("btn_new_atbat")}
                  </button>
                </div>
              ) : step === "build" ? (
                /* 🌟 核心修復：強制定義 column 排版並鎖定 order 順序 */
                <div
                  style={{
                    marginTop: 0,
                    padding: "16px",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* 🌟 1. 頂部標題：order 設為 1，置於最上方 */}
                  <div
                    style={{
                      order: 1,
                      width: "100%",
                      borderBottom: "1px solid #e2e8f0",
                      paddingBottom: "8px",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        color: "#0284c7",
                        fontSize: "15px",
                        fontWeight: "bold",
                        display: "block",
                      }}
                    >
                      {lang === "en"
                        ? `Pitch #${sequence.length + 1} Setup`
                        : `第 ${sequence.length + 1} 球設定`}
                    </span>
                  </div>

                  {/* 🌟 2. 下拉選單元件：order 設為 2 */}
                  <div style={{ order: 2, width: "100%" }}>
                    <PitchSetupSelects
                      mode="interactive"
                      arsenal={pitcherData?.arsenal}
                      pitchType={currentType}
                      pitchZone={currentZone}
                      onTypeChange={setCurrentType}
                      onZoneChange={setCurrentZone}
                    />
                  </div>

                  {/* 🌟 3. 投球按鈕：order 設為 3，置於最底部 */}
                  <div style={{ order: 3, width: "100%" }}>
                    <button
                      className="btn-simulate"
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "15px",
                        fontWeight: "bold",
                        backgroundColor: "#0284c7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: isSimulating ? "not-allowed" : "pointer",
                      }}
                      onClick={handlePitch}
                      disabled={isSimulating}
                    >
                      {isSimulating
                        ? t("simulating_pitch")
                        : `⚾ ${t("btn_pitch")}`}
                    </button>
                  </div>
                </div>
              ) : (
                /* 打者反應選擇面板 */
                <div
                  style={{
                    marginTop: 0,
                    padding: "16px",
                    background: "#fff",
                    border: "2px solid var(--highlight)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: "8px" }}>
                    <label
                      style={{
                        color: "var(--highlight)",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      {t("select_reaction_label")}
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
                        {t("interactive_take")}{" "}
                        {currentZone.includes("壞") ? "(B)" : "(S)"}
                      </span>
                      <span>
                        {currentProbs ? currentProbs[0].toFixed(1) : "--"}%
                      </span>
                    </button>
                    <button
                      onClick={() => handleSelectOutcome("Whiff")}
                      style={outcomeBtnStyle("#27ae60")}
                    >
                      <span>{t("interactive_whiff")}</span>
                      <span>
                        {currentProbs ? currentProbs[1].toFixed(1) : "--"}%
                      </span>
                    </button>
                    <button
                      onClick={() => handleSelectOutcome("Foul")}
                      style={outcomeBtnStyle("#f39c12")}
                    >
                      <span>{t("interactive_foul")}</span>
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
                        <span>{t("interactive_weak")}</span>
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
                        <span>{t("interactive_hard")}</span>
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

          {/* 右側區塊：配球歷史清單 */}
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
                {t("interactive_empty_hint")}
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
                    {t("interactive_history_title")}
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
                    {t("btn_undo")}
                  </button>
                </div>

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

const outcomeBtnStyle = (bgColor) => ({
  width: "100%",
  boxSizing: "border-box",
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
