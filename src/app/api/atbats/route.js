import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalAtbats } from "@/lib/localDataLoader"; // 🌟 引入本機載入器

export const dynamic = "force-dynamic";

// 🌟 定義前端 UI 渲染專用的白名單過濾器 (徹底剔除 raw_* 物理欄位)
function sanitizeAtBats(atbatsList) {
  if (!Array.isArray(atbatsList)) return [];

  return atbatsList.map((ab) => ({
    ab_id: ab.ab_id,
    pitcher_id: ab.pitcher_id,
    label: ab.label,
    stand: ab.stand,
    sequence: (ab.sequence || []).map((p) => ({
      num: p.num,
      type: p.type,
      name: p.name,
      speed: p.speed,
      result: p.result,
      isStrike: p.isStrike,
      count: p.count,
      x: p.x,
      y: p.y,
      zone_name: p.zone_name,
      launch_speed: p.launch_speed || "",
    })),
  }));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pitcherId = searchParams.get("pitcher_id");

    // 🌟 1. 零信任輸入防禦：驗證 pitcher_id 格式
    if (!pitcherId || !/^\d+$/.test(pitcherId)) {
      return NextResponse.json(
        { error: "Zero Trust: Invalid pitcher_id format" },
        { status: 400 }
      );
    }

    const isLocalMode =
      process.env.DATA_SOURCE === "local" ||
      process.env.FORCE_LOCAL_DATA === "true";

    // ==========================================
    // 🌟 第 0 優先：完全離線本機極速直讀 (< 2ms)
    // ==========================================
    if (isLocalMode) {
      const localData = getLocalAtbats(pitcherId);
      if (localData !== null) {
        return NextResponse.json(sanitizeAtBats(localData));
      }
      console.warn(
        `⚠️ [Local Data] 找不到投手 ${pitcherId} 的本機打席，嘗試向雲端查詢...`
      );
    }

    const flaskUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    // ==========================================
    // 第一優先：Supabase 雲端資料庫 (線上生產環境)
    // ==========================================
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("atbats")
          .select("ab_id, label, stand, sequence")
          .eq("pitcher_id", pitcherId)
          .order("label", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          return NextResponse.json(sanitizeAtBats(data));
        }
      } catch (dbErr) {
        console.warn(
          "⚠️ [BFF 容錯警報] Supabase 查詢打席失敗，退回 Flask 備援...",
          dbErr.message
        );
      }
    }

    // ==========================================
    // 第二降級：退回 Python Flask 備援
    // ==========================================
    console.log(`🔄 [BFF 備援] 向 Flask 抓取投手 ${pitcherId} 的打席...`);

    const res = await fetch(`${flaskUrl}/api/atbats/${pitcherId}`, {
      headers: {
        "X-Internal-API-Key": internalSecret,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Flask 後端回應異常 (Status: ${res.status})`);
    }

    const fallbackData = await res.json();
    return NextResponse.json(sanitizeAtBats(fallbackData));
  } catch (err) {
    console.error("❌ [BFF 錯誤] 無法取得實戰打席：", err.message);
    return NextResponse.json(
      { error: "無法取得打席資料", detail: err.message },
      { status: 502 }
    );
  }
}
