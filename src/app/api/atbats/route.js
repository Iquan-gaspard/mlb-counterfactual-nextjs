import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pitcherId = searchParams.get("pitcher_id");

    // 🌟 1. 零信任輸入防禦：驗證 pitcher_id 格式 (防 SQL / 命令注入)
    if (!pitcherId || !/^\d+$/.test(pitcherId)) {
      return NextResponse.json(
        { error: "Zero Trust: Invalid pitcher_id format" },
        { status: 400 }
      );
    }

    const forceLocal = process.env.FORCE_LOCAL_DATA === "true";
    const flaskUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";
    const internalSecret =
      process.env.INTERNAL_API_SECRET || "my-super-secret-baseball-key-2026";

    // ==========================================
    // 第一優先：Supabase 雲端資料庫 (若未強制本地)
    // ==========================================
    if (!forceLocal && supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("atbats")
          .select("ab_id, label, stand, sequence")
          .eq("pitcher_id", pitcherId)
          .order("label", { ascending: true });

        if (error) throw error;

        // 若資料庫有該投手的打席資料，直接回傳
        if (data && data.length > 0) {
          return NextResponse.json(data);
        }
      } catch (dbErr) {
        console.warn(
          "⚠️ [BFF 容錯警報] Supabase 查詢打席失敗或連線逾時，立即啟動降級機制退回 Flask 後端...",
          dbErr.message
        );
      }
    }

    // ==========================================
    // 第二降級：自動退回 Python Flask 本地備援
    // ==========================================
    console.log(
      `🔄 [BFF 備援啟動] 正在向 Flask 抓取投手 ${pitcherId} 的實戰打席備用清單...`
    );

    // 🌟 零信任要求：向內部 Flask 請求時，必須安全注入內部金鑰
    const res = await fetch(`${flaskUrl}/api/atbats/${pitcherId}`, {
      headers: {
        "X-Internal-API-Key": internalSecret,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(
        `Flask 後端備援亦無法提供打席資料 (Status: ${res.status})`
      );
    }

    const fallbackData = await res.json();
    return NextResponse.json(fallbackData);
  } catch (err) {
    console.error(
      "❌ [BFF 終極錯誤] 雲端資料庫與後端備援均無法取得實戰打席：",
      err.message
    );
    return NextResponse.json(
      { error: "無法取得打席資料", detail: err.message },
      { status: 502 }
    );
  }
}
