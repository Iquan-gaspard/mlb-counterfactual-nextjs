// import { useState, useEffect } from "react";
// import { supabase } from "../lib/supabase"; // 🌟 改用 Supabase 客戶端
// import { API_BASE_URL } from "../app/PitcherProvider"; // 🌟 引入 Flask 網址

// export default function useBatters() {
//   const [batters, setBatters] = useState([]);
//   const [selectedBatterId, setSelectedBatterId] = useState("");
//   const [selectedStand, setSelectedStand] = useState("R");
//   const [isLoadingBatters, setIsLoadingBatters] = useState(false);

//   useEffect(() => {
//     async function loadBatters() {
//       setIsLoadingBatters(true);

//       // 檢查是否手動強制使用本地後端
//       const forceLocal = process.env.NEXT_PUBLIC_FORCE_LOCAL_DATA === "true";

//       // ==========================================
//       // 第一優先：Supabase 雲端資料庫 (若未強制本地)
//       // ==========================================
//       if (!forceLocal) {
//         try {
//           const { data, error } = await supabase
//             .from("batters")
//             .select("*")
//             .order("name", { ascending: true });

//           if (error) throw error;

//           if (data && data.length > 0) {
//             setBatters(data);
//             setSelectedBatterId(data[0].batter_id.toString());
//             setSelectedStand(data[0].stand);
//             console.log(`✅ [Supabase] 成功載入 ${data.length} 位打者資料！`);
//             setIsLoadingBatters(false);
//             return; // 成功直接返回
//           }
//         } catch (dbErr) {
//           console.warn(
//             "⚠️ 雲端 Supabase 連線失敗，啟動降級機制退回 Flask 後端...",
//             dbErr
//           );
//         }
//       }

//       // ==========================================
//       // 第二降級：退回 Python Flask 本地後端 API
//       // ==========================================
//       try {
//         console.log("🔄 正在向後端 API 抓取打者備用名單...");
//         const res = await fetch(`${API_BASE_URL}/api/batters`);
//         if (!res.ok) throw new Error("Flask 後端 API 回應錯誤");

//         const data = await res.json();
//         if (data && data.length > 0) {
//           setBatters(data);
//           setSelectedBatterId(data[0].batter_id.toString());
//           setSelectedStand(data[0].stand);
//           console.log(
//             `✅ [Flask 後端備援] 成功載入 ${data.length} 位打者資料！`
//           );
//         }
//       } catch (backendErr) {
//         console.error(
//           "❌ 雲端資料庫與後端備援均無法取得打者清單：",
//           backendErr
//         );
//       } finally {
//         setIsLoadingBatters(false);
//       }
//     }

//     loadBatters();
//   }, []);

//   return {
//     batters,
//     selectedBatterId,
//     setSelectedBatterId,
//     selectedStand,
//     setSelectedStand,
//     isLoadingBatters,
//   };
// }

import { useState, useEffect } from "react";

export default function useBatters() {
  const [batters, setBatters] = useState([]);
  const [selectedBatterId, setSelectedBatterId] = useState("");
  const [selectedStand, setSelectedStand] = useState("R");
  const [isLoadingBatters, setIsLoadingBatters] = useState(false);

  useEffect(() => {
    async function loadBatters() {
      setIsLoadingBatters(true);
      try {
        const res = await fetch("/api/batters");
        if (!res.ok) throw new Error("無法取得打者資料");
        const data = await res.json();

        if (data && data.length > 0) {
          setBatters(data);
          setSelectedBatterId(data[0].batter_id.toString());
          setSelectedStand(data[0].stand);
        }
      } catch (err) {
        console.error("載入打者失敗：", err);
      } finally {
        setIsLoadingBatters(false);
      }
    }

    loadBatters();
  }, []);

  return {
    batters,
    selectedBatterId,
    setSelectedBatterId,
    selectedStand,
    setSelectedStand,
    isLoadingBatters,
  };
}
