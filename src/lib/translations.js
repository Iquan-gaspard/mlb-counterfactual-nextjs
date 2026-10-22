// src/lib/translations.js
export const translations = {
  zh: {
    // 實戰打席頁面專用
    select_atbat_label: "選擇實戰打席",
    search_atbat_placeholder: "搜尋打者或日期...",
    original_sequence_title: "實戰紀錄",
    counterfactual_lab_title: "反事實配球實驗室 - 決戰球 / 佈局球",
    strategy_label: "實驗目標",
    opt_putaway: "改變決戰球 (Putaway Pitch - 第 N 球)",
    opt_setup: "改變佈局球 (Setup Pitch - 第 N-1 球)",
    pitch_type_label: "改變球種",
    location_label: "進壘位置",
    btn_re_simulate: "重新模擬",
    simulating: "AI 推演中...",

    // 5 分類擊球結果 (Statcast 標準)
    outcome_take: "👀 不揮棒 (Take)",
    outcome_whiff: "💨 揮空 (Whiff)",
    outcome_foul: "🛑 界外 (Foul)",
    outcome_weak: "🏏 軟弱擊球 (Soft Contact)",
    outcome_hard: "🚀 強勁擊球 (Hard-Hit)",

    // 彈窗警告
    alert_insufficient_pitches:
      "此打席球數不足，無法進行反事實推演 (至少需 2 球)",
    alert_simulation_failed: "推演運算失敗，請確認後端連線狀態",

    // 🎯 自由配球 (Builder Page)
    builder_title: "配球推演實驗室 - 打席序列沙盤推演",
    planned_pitches: "推演球數",
    btn_run_sequence: "啟動序列推演",
    simulating_sequence: "逐球推演中...",
    builder_empty_hint_1: "設定配球序列後，點擊「啟動序列推演」",
    builder_empty_hint_2: "模型將層層遞迴預測最可能的打席演變路徑。",
    builder_empty_hint_3: "(自動判定兩好球界外纏鬥與四壞保送機制)",
    expected_sequence_title: "📋 預期配球序列",

    // 🎮 沉浸式逐球對決 (Interactive Page)
    interactive_title: "🎮 沉浸式逐球推演",
    status_strikeout: "🎯 三振出局！",
    status_walk: "🚶 四壞保送！",
    status_ball_in_play: "⚾ 擊球進場！",
    btn_new_atbat: "🔄 開始新打席",
    pitch_setup_prefix: "第 ",
    pitch_setup_suffix: " 球配置",
    btn_pitch: "⚾ 投球出手",
    simulating_pitch: "運算推演中...",
    select_reaction_label: "✨ 選擇打擊結果 (Pitch Result)：",
    interactive_take: "👀 Take",
    interactive_whiff: "💨 Whiff",
    interactive_foul: "🛑 Foul",
    interactive_weak: "🏏 Soft Contact",
    interactive_hard: "🚀 Hard-Hit",
    interactive_empty_hint: "🎯 請選擇球種與進壘點，開始進行配球博弈",
    interactive_history_title: "📋 逐球紀錄 (Pitch-by-Pitch Log)",
    btn_undo: "↩️ 復原 (Undo)",
  },
  en: {
    // -------------------------------------------------------------
    // Actual At-Bat & Counterfactual Lab (Savant & Gameday Style)
    // -------------------------------------------------------------
    select_atbat_label: "Select At-Bat",
    search_atbat_placeholder: "Search batter or date...",
    original_sequence_title: "Observed Sequence",
    counterfactual_lab_title: "Counterfactual Lab — Putaway & Setup Pitches",
    strategy_label: "Target Pitch",
    opt_putaway: "Modify Putaway Pitch (Pitch N)",
    opt_setup: "Modify Setup Pitch (Pitch N-1)",
    pitch_type_label: "Pitch Selection",
    location_label: "Target Zone",
    btn_re_simulate: "Run Simulation",
    simulating: "Simulating...",

    // 5 Statcast Outcomes (Standard MLB Terminology)
    outcome_take: "👀 Take",
    outcome_whiff: "💨 Whiff",
    outcome_foul: "🛑 Foul",
    outcome_weak: "🏏 Soft Contact",
    outcome_hard: "🚀 Hard-Hit",

    // Alerts
    alert_insufficient_pitches:
      "At least 2 pitches are required in this plate appearance for counterfactual analysis.",
    alert_simulation_failed:
      "Simulation failed. Please verify backend connection.",

    // -------------------------------------------------------------
    // 🎯 Sequence Builder Page (Modeling & Projection Style)
    // -------------------------------------------------------------
    builder_title: "Pitch Sequence Simulator — Plate Appearance Modeling",
    planned_pitches: "Sequence Length",
    btn_run_sequence: "Simulate Sequence",
    simulating_sequence: "Simulating sequence...",
    builder_empty_hint_1:
      "Configure your pitch sequence and click 'Simulate Sequence'.",
    builder_empty_hint_2:
      "The model recursively projects the most probable plate appearance progression.",
    builder_empty_hint_3: "(Accounts for two-strike fouls and walk scenarios)",
    expected_sequence_title: "📋 Projected Pitch Sequence",

    // -------------------------------------------------------------
    // 🎮 Interactive Simulation Page (Broadcast & Gameday Style)
    // -------------------------------------------------------------
    interactive_title: "🎮 Interactive Pitch Sequencing",
    status_strikeout: "🎯 Strikeout!",
    status_walk: "🚶 Walk!",
    status_ball_in_play: "⚾ In Play!",
    btn_new_atbat: "🔄 Next At-Bat",
    pitch_setup_prefix: "Pitch #",
    pitch_setup_suffix: " Setup",
    btn_pitch: "⚾ Deliver Pitch",
    simulating_pitch: "Processing...",
    select_reaction_label: "✨ Select Pitch Result:",
    interactive_take: "👀 Take",
    interactive_whiff: "💨 Whiff",
    interactive_foul: "🛑 Foul",
    interactive_weak: "🏏 Soft Contact",
    interactive_hard: "🚀 Hard-Hit",
    interactive_empty_hint:
      "🎯 Select pitch type and target zone to begin the at-bat.",
    interactive_history_title: "📋 Pitch-by-Pitch Log",
    btn_undo: "↩️ Undo",
  },
};
