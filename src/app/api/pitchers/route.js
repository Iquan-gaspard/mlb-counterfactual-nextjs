import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalPitchers } from "@/lib/localDataLoader";

export async function GET() {
  const flaskUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";
  const internalSecret =
    process.env.INTERNAL_API_SECRET || "dev-secret-key-change-in-prod";
  const forceLocal = process.env.FORCE_LOCAL_DATA === "true";

  // 1. 優先查詢 Supabase 雲端資料庫
  if (!forceLocal && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from("pitchers")
        .select("pitcher_id, name, throws, arm_angle, arsenal")
        .order("name", { ascending: true });

      if (error) {
        console.error(
          "❌ [BFF pitchers] Supabase SQL 查詢錯誤：",
          error.message
        );
      } else if (data && data.length > 0) {
        // 資安脫敏過濾：僅保留選單所需的 value 與 label
        const sanitized = data.map((p) => ({
          pitcher_id: p.pitcher_id,
          name: p.name,
          throws: p.throws,
          arm_angle: p.arm_angle,
          arsenal: (p.arsenal || []).map((a) => ({
            value: a.value,
            label: a.label,
          })),
        }));
        return NextResponse.json(sanitized);
      } else {
        console.warn(
          "⚠️ [BFF pitchers] Supabase 回傳空陣列，準備切換 Flask 備援..."
        );
      }
    } catch (err) {
      console.warn(
        "⚠️ [BFF pitchers] Supabase 網路異常，切換 Flask 備援：",
        err.message
      );
    }
  }

  // 2. 備援機制：向 Flask 後端抓取
  try {
    console.log("🔄 [BFF pitchers] 正在向 Flask 取得投手備援名單...");
    const res = await fetch(`${flaskUrl}/api/pitchers`, {
      headers: { "X-Internal-API-Key": internalSecret },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      console.error(
        `❌ [BFF pitchers] Flask 備援失敗，HTTP 狀態碼: ${res.status}`
      );
    }
  } catch (flaskErr) {
    console.error("❌ [BFF pitchers] Flask 備援連線失敗：", flaskErr.message);
  }

  return NextResponse.json({ error: "無法取得投手資料" }, { status: 500 });
}
