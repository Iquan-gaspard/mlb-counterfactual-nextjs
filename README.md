# ⚾ MLB Pitch Sequence Simulator
### 基於 PyTorch 時序模型的大聯盟配球推演與反事實實驗室

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-Sequence_Model-ee4c2c?logo=pytorch&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-BFF_Tokyo-black?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-Free_Tier-46E3B7?logo=render&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

> **專案簡介**：本專案為個人獨立開發的棒球配球推演與戰術模擬系統。在**零預算（完全採用免費雲端方案）**的硬限制下，結合 PyTorch 時序神經網絡與現代 Web 架構，探索配球鋪陳、速差擾動與進壘位置對打者出棒結果的動態影響。

---

## ✨ 核心功能特色 (Features)

系統內建完整的中英雙語介面（**繁體中文 / English**），提供三大核心配球推演模式：

### 1. 📊 實戰打席分析與反事實實驗室 (Actual At-Bat & Counterfactual Lab)
* **實戰重現**：直觀載入大聯盟頂級投手實戰打席，在好球帶九宮格精準重現歷史進壘軌跡、球速與判決結果。
* **反事實推演 (What-If Analysis)**：允許使用者任意置換打席中的「決戰球（Putaway）」或「佈局球（Setup）」，即時運算若改變配球策略時，打者在 5 種打擊結果上的機率變化。

### 2. 🎯 自由配球沙盤推演 (Auto-Sequence Builder)
* 支援自訂 1～7 球的連續配球路徑，自選球種與 18 個好壞球進壘分區。
* 內建規則模擬引擎：考量球數推進、兩好球界外纏鬥保護與四壞保送機制，遞迴推演最可能的對決終局走向。

### 3. 🎮 沉浸式逐球對決 (Interactive Duel)
* 提供投手第一視角的互動體驗，即時結算當前球路的打者出棒機率。
* 使用者可指派打者反應推進球數，模擬實戰中的心理攻防與球數博弈。

---

## 🧠 AI 預測引擎能力 (AI Engine)

* **多維度時序建模**：不同於僅看單球進壘點的靜態判斷，模型專注於捕捉前後球之間的「速度差異」與「進壘視覺落差」，深度模擬打者的動態出棒預期。
* **5 大打擊結果機率結算**：單次推演同時輸出五項關鍵指標機率：
  * **Take（選球/不揮棒）**
  * **Whiff（揮棒空振）**
  * **Foul（界外破壞）**
  * **Weak Contact（弱擊球）**
  * **Hard Contact（強擊球）**
* **實證預測效能**：在十餘萬筆實戰打席驗證下，模型在跨類別綜合辨識度上表現優異（Macro OvR AUC 達 0.77+，Weighted OvR AUC 達 0.79+），預測能力顯著優於傳統線性對照模型。

---

## 🛠️ 全端架構與雲端資源工程 (Architecture & Security)

在免費雲端方案資源受限的條件下，系統落實了現代全端開發的工程優化與資安防禦：

```text
[ 瀏覽器 Client ] 
       │  (HTTPS 請求 / 乾淨脫敏介面)
       ▼
[ Next.js BFF (Vercel) ]  <─── 離線本機快取模式 (DATA_SOURCE=local, < 3ms)
       │  
       ├─► Supabase (雲端資料庫儲存球員與打席清單)
       │
       ▼  (內部金鑰驗證: X-Internal-API-Key)
[ Python Flask API (Render) ]  <─── 輕量健康檢查保活 (維持容器活躍)
```

1. **BFF 代理層與零知識前端 (Zero-Knowledge Client)**
   * **特徵安全隔離**：神經網絡的物理特徵全數在伺服器端處理，前端完全不持有任何底層演算法數據。
   * **出站資料脫敏**：實作嚴格的白名單過濾機制，清除未公開物理欄位，有效壓縮 40% 以上的網路傳輸體積。
2. **嚴格的資安失效防護 (Fail-Closed Enforcement)**
   * 內部通行金鑰全面禁止靜默使用寫死字串。在生產環境下若偵測到密鑰缺失，後端伺服器將強制終止啟動，落實零信任防禦。
3. **低成本效能壓榨策略**
   * **記憶體快取極速模式**：內建本地離線直讀機制，可跳過資料庫網路往返，將打席與球員載入延遲壓進 **3ms 以內**。
   * **運算剪枝優化**：在連續配球推演中快取歷史前綴，避免重複的前向計算消耗。
   * **自動保活機制**：提供無防護的公開 `/health` 端點，配合外部排程 Ping 請求，大幅緩解免費用戶常遭遇的冷啟動等待問題。

---

## 🚀 本地開發與快速啟動 (Local Setup)

### 1. 後端推論服務啟動
```bash
cd server

# 建立並啟動虛擬環境
python -m venv .venv
source .venv/bin/activate  # Windows 請使用 .venv\Scripts\activate

# 安裝依賴套件
pip install -r requirements.txt

# 設定本地環境變數 (.env)
echo "FLASK_ENV=development" >> .env
echo "INTERNAL_API_SECRET=your-local-dev-key" >> .env

# 啟動伺服器 (運行於 http://127.0.0.1:5000)
python app.py
```

### 2. 前端 Next.js 應用啟動
```bash
cd baseball-next-app

# 安裝 Node.js 依賴
npm install

# 設定本地環境變數 (.env.local)
echo "INTERNAL_API_SECRET=your-local-dev-key" >> .env.local
echo "FLASK_BACKEND_URL=http://127.0.0.1:5000" >> .env.local
echo "DATA_SOURCE=local" >> .env.local

# 啟動開發伺服器 (運行於 http://localhost:3000)
npm run dev
```

---

## 📄 License
本專案採用 [MIT License](LICENSE) 開源授權。