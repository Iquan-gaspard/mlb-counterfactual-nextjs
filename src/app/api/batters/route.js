import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function GET() {
  const forceLocal = process.env.FORCE_LOCAL_DATA === "true";
  const flaskUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";

  if (!forceLocal) {
    try {
      const { data, error } = await supabaseServer
        .from("batters")
        .select("batter_id, name, stand, label")
        .order("name", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (dbErr) {
      console.warn(
        "⚠️ [BFF] Supabase 查詢失敗，退回 Flask 備援...",
        dbErr.message
      );
    }
  }

  try {
    const res = await fetch(`${flaskUrl}/api/batters`, { cache: "no-store" });
    if (!res.ok) throw new Error("Flask 回應異常");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "無法取得打者資料" }, { status: 502 });
  }
}
