import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { pitcher_id, batter_id, stand, b_count, s_count, pitches } = body;

    // 1. 算力邊界檢查
    if (
      !pitches ||
      !Array.isArray(pitches) ||
      pitches.length === 0 ||
      pitches.length > 7
    ) {
      return NextResponse.json(
        { error: "Zero Trust: pitches 長度必須介於 1 到 7 顆球" },
        { status: 400 }
      );
    }

    // 2. 取得真實客戶端 IP
    const forwardedHeader = request.headers.get("x-forwarded-for");
    const clientIp = forwardedHeader
      ? forwardedHeader.split(",")[0].trim()
      : "127.0.0.1";

    // 3. 取得物理特性 (改用 maybeSingle 避免 0 筆資料時拋出例外崩潰)
    let pitcherData = {};
    let batterAdvStats = {};

    if (supabaseServer) {
      try {
        const [pitcherRes, batterRes] = await Promise.all([
          supabaseServer
            .from("pitchers")
            .select("arm_angle, throws, arsenal")
            .eq("pitcher_id", String(pitcher_id))
            .maybeSingle(),
          supabaseServer
            .from("batters")
            .select("adv_stats")
            .eq("batter_id", String(batter_id))
            .maybeSingle(),
        ]);
        pitcherData = pitcherRes?.data || {};
        batterAdvStats = batterRes?.data?.adv_stats || {};
      } catch (dbErr) {
        console.warn(
          "⚠️ [BFF simulate_sequence] Supabase 查詢異常，改用預設物理常數：",
          dbErr.message
        );
      }
    }

    // 4. 特徵合成
    const enrichedPitches = pitches.map((p) => {
      const pt = pitcherData.arsenal?.find((a) => a.value === p.type);
      const zonePhysics = pt?.zone_stats?.[p.zone] ||
        pt?.global_stats || { speed: 0.95, pfx_x: 0.0, pfx_z: 0.0 };

      return {
        type: p.type,
        zone: p.zone,
        result: p.result,
        speed: zonePhysics.speed,
        pfx_x: zonePhysics.pfx_x,
        pfx_z: zonePhysics.pfx_z,
      };
    });

    const backendUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";
    const internalSecret =
      process.env.INTERNAL_API_SECRET || "my-super-secret-baseball-key-2026";

    console.log(
      `📡 [BFF] 正在發送推演請求至後端：${backendUrl}/api/simulate_sequence`
    );

    // 5. 轉發至 Flask 推論服務
    const response = await fetch(`${backendUrl}/api/simulate_sequence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": internalSecret,
        "X-Forwarded-For": clientIp,
      },
      body: JSON.stringify({
        pitcher_id,
        p_throws: pitcherData.throws || "R",
        arm_angle: pitcherData.arm_angle || 38.6,
        stand: stand || "R",
        adv_stats: batterAdvStats,
        b_count: Number(b_count) || 0,
        s_count: Number(s_count) || 0,
        pitches: enrichedPitches,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ [Flask 推演失敗] HTTP ${response.status}:`, errText);
      return new NextResponse(errText, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [BFF 代理核心崩潰，原因]:", error.message);
    return NextResponse.json(
      { error: "BFF Proxy 無法連線至推論後端", details: error.message },
      { status: 500 }
    );
  }
}
