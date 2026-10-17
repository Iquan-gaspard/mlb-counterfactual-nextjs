import { useState, useEffect } from "react";
// 確保您的 API_BASE_URL 匯入路徑正確 (請依據您的資料夾結構微調)
import { API_BASE_URL } from "../app/PitcherProvider";

export default function useBatters() {
  const [batters, setBatters] = useState([]);
  const [selectedBatterId, setSelectedBatterId] = useState("");
  const [selectedStand, setSelectedStand] = useState("R");
  const [isLoadingBatters, setIsLoadingBatters] = useState(false);

  useEffect(() => {
    async function fetchBatters() {
      setIsLoadingBatters(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/batters`);
        if (!res.ok) throw new Error("取得打者資料失敗");
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

  return {
    batters,
    selectedBatterId,
    setSelectedBatterId,
    selectedStand,
    setSelectedStand,
    isLoadingBatters,
  };
}
