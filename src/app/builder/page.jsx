"use client";
import React, { useState, useEffect, useContext } from "react";
import StrikeZone, { ZONE_COORDINATES } from "../../components/StrikeZone";
import { PitcherContext, selectStyles } from "../PitcherProvider";
import PitchResultCard from "../../components/PitchResultCard";
import MatchupSelector from "../../components/MatchupSelector";
import PitchSetupSelects from "../../components/PitchSetupSelects";
import useBatters from "../../hooks/useBatters";
import { useLanguage } from "@/context/LanguageContext"; // 🌟 1. 引入語系 Hook

export default function BuilderPage() {
  const { pitcherId, pitcherData } = useContext(PitcherContext);
  const { t } = useLanguage(); // 🌟 2. 取得翻譯函式 t
  const {
    batters,
    selectedBatterId,
    setSelectedBatterId,
    selectedStand,
    setSelectedStand,
    isLoadingBatters,
  } = useBatters();

  const [isModified, setIsModified] = useState(false);

  const [seqLength, setSeqLength] = useState(5);
  const [pitches, setPitches] = useState([]);
  const [simResults, setSimResults] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);
  // const [saveStatus, setSaveStatus] = useState(""); // "" | "success" | "error"

  // 🌟 2. 獨立的手動儲存函式
  // const handleSaveRecord = async () => {
  //   if (simResults.length === 0) return;
  //   setIsSaving(true);
  //   setSaveStatus("");

  //   try {
  //     const response = await fetch("/api/history", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         pitcher_id: pitcherId,
  //         batter_id: selectedBatterId,
  //         stand: selectedStand,
  //         sequence_data: simResults,
  //       }),
  //     });

  //     if (!response.ok) throw new Error("儲存失敗");

  //     setSaveStatus("success");
  //     setTimeout(() => setSaveStatus(""), 3000);
  //   } catch (err) {
  //     console.error("❌ 寫入資料庫失敗：", err);
  //     setSaveStatus("error");
  //     setTimeout(() => setSaveStatus(""), 3000);
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  // 2. 聰明陣列更新邏輯
  useEffect(() => {
    const defaultType = pitcherData?.arsenal?.[0]?.value || "FF";
    setPitches((prev) => {
      const isPitcherChanged =
        prev.length > 0 &&
        pitcherData?.arsenal &&
        !pitcherData.arsenal.some((pt) => pt.value === prev[0].type);
      if (prev.length === 0 || isPitcherChanged) {
        return Array.from({ length: seqLength }).map(() => ({
          type: defaultType,
          zone: "正中",
        }));
      }
      if (seqLength > prev.length) {
        const additions = Array.from({ length: seqLength - prev.length }).map(
          () => ({ type: defaultType, zone: "正中" })
        );
        return [...prev, ...additions];
      }
      if (seqLength < prev.length) return prev.slice(0, seqLength);
      return prev;
    });
    setSimResults([]);
  }, [seqLength, pitcherData]);

  const updatePitch = (index, field, value) => {
    const newPitches = [...pitches];
    newPitches[index][field] = value;
    setPitches(newPitches);
    setIsModified(true);
  };

  // 核心：前端逐球推演引擎
  const runSequence = async () => {
    setIsSimulating(true);
    setIsModified(false);

    let currentB = 0;
    let currentS = 0;
    let finalResults = [];

    for (let i = 0; i < pitches.length; i++) {
      const currentPitch = pitches[i];
      const isFinalPitch = i === pitches.length - 1;
      let probs = [];

      try {
        const pastPitchesPayload = finalResults.map((r) => ({
          type: r.type,
          zone: r.zone,
          result: r.selected_result,
        }));

        pastPitchesPayload.push({
          type: currentPitch.type,
          zone: currentPitch.zone,
        });

        const response = await fetch("/api/simulate_sequence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pitcher_id: pitcherId,
            batter_id: selectedBatterId,
            stand: selectedStand,
            b_count: currentB,
            s_count: currentS,
            pitches: pastPitchesPayload,
          }),
        });

        if (!response.ok) throw new Error("API 回應錯誤");

        const data = await response.json();
        const lastResult = data.results[data.results.length - 1];
        probs = [
          parseFloat(lastResult.probs.take),
          parseFloat(lastResult.probs.whiff),
          parseFloat(lastResult.probs.foul),
          parseFloat(lastResult.probs.weak_contact),
          parseFloat(lastResult.probs.hard_contact),
        ];
      } catch (e) {
        console.warn(`第 ${i + 1} 球連線失敗，套用測試數據。原因:`, e);
        probs = [35.2, 25.1, 22.4, 12.0, 5.3];
      }

      let selectedResult = null;
      let isWalk = false;
      let isStrikeout = false;

      if (!isFinalPitch) {
        const isStrikeZone = !currentPitch.zone.includes("壞");
        let allowedChoices = ["Take", "Whiff", "Foul"];

        if (currentS === 2) {
          if (isStrikeZone) {
            allowedChoices = ["Foul"];
          } else {
            allowedChoices = ["Take", "Foul"];
          }
        }

        const probMap = { Take: probs[0], Whiff: probs[1], Foul: probs[2] };
        let maxProb = -1;
        for (const choice of allowedChoices) {
          if (probMap[choice] > maxProb) {
            maxProb = probMap[choice];
            selectedResult = choice;
          }
        }

        if (selectedResult === "Take") {
          if (isStrikeZone) currentS += 1;
          else currentB += 1;
        } else if (selectedResult === "Whiff") {
          currentS += 1;
        } else if (selectedResult === "Foul") {
          if (currentS < 2) currentS += 1;
        }

        if (currentB >= 4) isWalk = true;
        if (currentS >= 3) isStrikeout = true;
      }

      finalResults.push({
        pitch_num: i + 1,
        type: currentPitch.type,
        zone: currentPitch.zone,
        probs: {
          take: probs[0].toFixed(1),
          whiff: probs[1].toFixed(1),
          foul: probs[2].toFixed(1),
          weak_contact: probs[3].toFixed(1),
          hard_contact: probs[4].toFixed(1),
        },
        selected_result: selectedResult,
        b_count: currentB,
        s_count: currentS,
        is_walk: isWalk,
        is_final: isFinalPitch,
      });

      if (isWalk || isStrikeout) break;
    }

    setSimResults(finalResults);
    setIsSimulating(false);
  };

  // 準備九宮格渲染資料
  const renderPitches =
    simResults.length > 0
      ? simResults.map((r, idx) => {
          const coords = ZONE_COORDINATES[r.zone] || { x: 50, y: 50 };
          const isLast = idx === simResults.length - 1;
          const isStrike = isLast
            ? !r.zone.includes("壞")
            : !(r.selected_result === "Take" && r.zone.includes("壞"));

          return {
            x: coords.x,
            y: coords.y,
            num: r.pitch_num,
            isStrike: isStrike,
            isModified: isLast,
            opacity: isLast ? 1 : 0.6 + (idx / simResults.length) * 0.4,
          };
        })
      : [];

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
        onMatchupChange={() => setSimResults([])}
      />

      <div className="panel" style={{ position: "relative" }}>
        {/* 🌟 替換標題 */}
        <div
          className="panel-header"
          style={{ color: "#e67e22", fontSize: "18px", marginBottom: "20px" }}
        >
          {t("builder_title")}
        </div>

        <div
          style={{
            display: "flex",
            gap: "30px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* 左側區塊：九宮格與設定表單 */}
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

            <div
              className="lab-controls"
              style={{
                marginTop: 0,
                padding: "15px",
                background: "#f8f9fa",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              {/* 配球數調整區塊 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "10px",
                }}
              >
                <label
                  style={{
                    color: "#e67e22",
                    fontWeight: "bold",
                    margin: 0,
                    fontSize: "14px",
                  }}
                >
                  {t("planned_pitches")}
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
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "none",
                      background: seqLength <= 1 ? "#f3f4f6" : "#e5e7eb",
                      cursor: seqLength <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    -
                  </button>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      width: "20px",
                      textAlign: "center",
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
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "none",
                      background: seqLength >= 7 ? "#f3f4f6" : "#e5e7eb",
                      cursor: seqLength >= 7 ? "not-allowed" : "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 逐球設定表單列 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {pitches.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        background: "#e67e22",
                        color: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "11px",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <PitchSetupSelects
                      mode="builder"
                      arsenal={pitcherData?.arsenal}
                      pitchType={p.type}
                      pitchZone={p.zone}
                      onTypeChange={(val) => updatePitch(idx, "type", val)}
                      onZoneChange={(val) => updatePitch(idx, "zone", val)}
                    />
                  </div>
                ))}
              </div>

              {/* 🌟 替換按鈕文字 */}
              <button
                className="btn-simulate"
                onClick={runSequence}
                disabled={isSimulating}
                style={{
                  backgroundColor: "#e67e22",
                  width: "100%",
                  padding: "12px",
                  fontSize: "15px",
                }}
              >
                {isSimulating
                  ? t("simulating_sequence")
                  : t("btn_run_sequence")}
              </button>
            </div>
          </div>

          {/* 右側區塊：推演結果清單 */}
          <div style={{ flex: "2 1 450px", minWidth: 0 }}>
            {simResults.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "300px",
                  border: "2px dashed #e0e6ed",
                  borderRadius: "12px",
                  color: "#95a5a6",
                  fontSize: "15px",
                  background: "#fafbfc",
                  padding: "20px",
                  textAlign: "center",
                  lineHeight: "1.6",
                }}
              >
                <span style={{ fontSize: "24px", marginBottom: "10px" }}>
                  ⚾
                </span>
                {/* 🌟 替換空狀態導引說明 */}
                {t("builder_empty_hint_1")}
                <br />
                {t("builder_empty_hint_2")}
                <br />
                {t("builder_empty_hint_3")}
              </div>
            ) : (
              <div
                className="pitch-list"
                style={{
                  width: "100%",
                  opacity: isModified ? 0.5 : 1,
                  transition: "opacity 0.3s",
                }}
              >
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
                  {/* 🌟 替換歷史軌跡標題 */}
                  <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "16px" }}>
                    {t("expected_sequence_title")}
                  </h3>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {simResults.map((r, idx) => (
                    <PitchResultCard
                      key={idx}
                      mode="builder"
                      pitchNum={r.pitch_num}
                      type={r.type}
                      zone={r.zone}
                      probs={{
                        take: r.probs.take,
                        whiff: r.probs.whiff,
                        foul: r.probs.foul,
                        weak: r.probs.weak_contact,
                        hard: r.probs.hard_contact,
                      }}
                      outcome={r.selected_result}
                      bCount={r.b_count}
                      sCount={r.s_count}
                      isWalk={r.is_walk}
                      isFinal={r.is_final}
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
