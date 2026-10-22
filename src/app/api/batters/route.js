import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalBatters } from "@/lib/localDataLoader";

export const dynamic = "force-dynamic";

function sanitizeBatters(list) {
  if (!Array.isArray(list)) return [];
  return list.map((b) => ({
    batter_id: b.batter_id,
    name: b.name,
    stand: b.stand,
    label: b.label,
  }));
}

export async function GET() {
  const isLocalMode =
    process.env.DATA_SOURCE === "local" ||
    process.env.FORCE_LOCAL_DATA === "true";

  // 🌟 第 0 優先：本機直接讀取
  if (isLocalMode) {
    const localBatters = getLocalBatters();
    if (localBatters) {
      return NextResponse.json(sanitizeBatters(localBatters));
    }
  }

  // 第一優先：Supabase 雲端
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from("batters")
        .select("batter_id, name, stand, label")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json(sanitizeBatters(data));
      }
    } catch (e) {
      console.warn("⚠️ [Batters] Supabase 異常：", e.message);
    }
  }

  // 第二降級：Flask 備援
  const flaskUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";
  const internalSecret = process.env.INTERNAL_API_SECRET;
  try {
    const res = await fetch(`${flaskUrl}/api/batters`, {
      headers: { "X-Internal-API-Key": internalSecret },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("❌ [Batters] Flask 備援失敗：", err.message);
  }

  return NextResponse.json({ error: "無法取得打者資料" }, { status: 502 });
}
