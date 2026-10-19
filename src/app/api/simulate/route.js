import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { pitcher_id, ab_id, sim_mode, pitch_type, pitch_zone } = body;

    // 🌟 1. 嚴格驗證必要欄位，不再需要前端傳 sequence
    if (!pitcher_id || !ab_id || !pitch_type || !pitch_zone) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    // 🌟 2. 伺服器端直連 Supabase：憑 ab_id 直接撈取該打席的 sequence 與 adv_stats！
    const [pitcherRes, atbatRes] = await Promise.all([
      supabaseServer
        .from("pitchers")
        .select("throws, arm_angle, arsenal")
        .eq("pitcher_id", pitcher_id)
        .single(),
      supabaseServer
        .from("atbats")
        .select("stand, adv_stats, sequence")
        .eq("ab_id", ab_id)
        .single(),
    ]);

    const pitcherData = pitcherRes.data || {};
    const atbatData = atbatRes.data || {};
    const sequence = atbatData.sequence || [];

    if (sequence.length < 2) {
      return NextResponse.json(
        { error: "該打席球數不足以進行反事實推演" },
        { status: 400 }
      );
    }

    // 取出投手分區物理特性
    let pitcherPhysics = { speed: 0.95, pfx_x: 0.0, pfx_z: 0.0 };
    const pt = pitcherData.arsenal?.find((a) => a.value === pitch_type);
    if (pt?.zone_stats?.[pitch_zone]) {
      pitcherPhysics = pt.zone_stats[pitch_zone];
    } else if (pt?.global_stats) {
      pitcherPhysics = pt.global_stats;
    }

    // 🌟 3. 在伺服器內部安全解析 N, N-1, N-2 球路
    const n = sequence[sequence.length - 1];
    const n1 = sequence[sequence.length - 2];
    const n2 = sequence.length >= 3 ? sequence[sequence.length - 3] : n1;

    const countParts = String(n.count || "0 - 0").split("-");
    const bCount = parseInt(countParts[0]?.trim()) || 0;
    const sCount = parseInt(countParts[1]?.trim()) || 0;

    const isN1Take =
      n1.result?.includes("ball") || n1.result?.includes("called_strike");
    const isN1Whiff = n1.result?.includes("swinging_strike");
    const isN1Foul = n1.result?.includes("foul");
    const n1Outcome = [
      isN1Take ? 1.0 : 0.0,
      isN1Whiff ? 1.0 : 0.0,
      isN1Foul ? 1.0 : 0.0,
    ];

    const backendUrl = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5000";
    const internalSecret =
      process.env.INTERNAL_API_SECRET || "my-super-secret-baseball-key-2026";

    const forwardedHeader = request.headers.get("x-forwarded-for");
    const clientIp = forwardedHeader
      ? forwardedHeader.split(",")[0].trim()
      : "127.0.0.1";
    // 🌟 4. 注入私鑰發送給內部 Flask
    const response = await fetch(`${backendUrl}/api/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": internalSecret,
        "X-Forwarded-For": clientIp, // 🌟 傳入真實 IP
      },
      body: JSON.stringify({
        pitcher_id,
        p_throws: pitcherData.throws || "R",
        arm_angle: pitcherData.arm_angle || 38.6,
        stand: atbatData.stand || "R",
        sim_mode: sim_mode || "last",
        pitch_type,
        pitch_zone,
        physics: pitcherPhysics,
        adv_stats: atbatData.adv_stats || {},
        b_count: bCount,
        s_count: sCount,
        orig_pitch: {
          speed: n.raw_speed / 100.0,
          px: n.raw_px,
          pz: n.raw_pz,
          pfx_x: n.raw_pfx_x,
          pfx_z: n.raw_pfx_z,
        },
        n1_pitch: {
          speed: n1.raw_speed / 100.0,
          px: n1.raw_px,
          pz: n1.raw_pz,
          pfx_x: n1.raw_pfx_x,
          pfx_z: n1.raw_pfx_z,
        },
        n2_pitch: {
          speed: n2.raw_speed / 100.0,
          px: n2.raw_px,
          pz: n2.raw_pz,
          pfx_x: n2.raw_pfx_x,
          pfx_z: n2.raw_pfx_z,
        },
        n1_outcome: n1Outcome,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new NextResponse(errText, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("BFF Simulate Error:", error);
    return NextResponse.json({ error: "BFF Proxy Error" }, { status: 500 });
  }
}
