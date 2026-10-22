import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalPitchers } from "@/lib/localDataLoader";

export const dynamic = "force-dynamic";

function sanitizePitchers(list) {
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({
    pitcher_id: p.pitcher_id,
    name: p.name,
    throws: p.throws,
    arm_angle: p.arm_angle,
    arsenal: (p.arsenal || []).map((a) => ({
      value: a.value,
      label: a.label,
    })),
  }));
}

export async function GET() {
  const isLocalMode =
    process.env.DATA_SOURCE === "local" ||
    process.env.FORCE_LOCAL_DATA === "true";

  // 🌟 第 0 優先：本機直接讀取
  if (isLocalMode) {
    const localPitchers = getLocalPitchers();
    if (localPitchers) {
      return NextResponse.json(sanitizePitchers(localPitchers));
    }
  }

  // 第一優先：Supabase 雲端
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from("pitchers")
        .select("pitcher_id, name, throws, arm_angle, arsenal")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json(sanitizePitchers(data));
      }
    } catch (e) {
      console.warn("⚠️ [Pitchers] Supabase 異常：", e.message);
    }
  }

  // 第二降級：Flask 備援
  const flaskUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";
  const internalSecret = process.env.INTERNAL_API_SECRET;
  try {
    const res = await fetch(`${flaskUrl}/api/pitchers`, {
      headers: { "X-Internal-API-Key": internalSecret },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("❌ [Pitchers] Flask 備援失敗：", err.message);
  }

  return NextResponse.json({ error: "無法取得投手資料" }, { status: 500 });
}
