import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// ==============================================================================
// 🌟 核心提速：Node.js 記憶體特徵快取 (解耦獨立快取池，TTL 10 分鐘)
// ==============================================================================
const PITCHER_CACHE = new Map();
const BATTER_CACHE = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 分鐘

async function getPitcherProfile(pitcherId) {
  const now = Date.now();
  if (PITCHER_CACHE.has(pitcherId)) {
    const cached = PITCHER_CACHE.get(pitcherId);
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  let pitcherData = {};
  if (supabaseServer) {
    try {
      const res = await supabaseServer
        .from("pitchers")
        .select("arm_angle, throws, arsenal")
        .eq("pitcher_id", String(pitcherId))
        .maybeSingle();

      pitcherData = res?.data || {};
      PITCHER_CACHE.set(pitcherId, { timestamp: now, data: pitcherData });
      console.log(
        `⚡ [Cache Miss -> Stored] 投手 ${pitcherId} 已載入 BFF 記憶體快取`
      );
    } catch (e) {
      console.warn("⚠️ [Pitcher Fetch] 查詢失敗：", e.message);
    }
  }
  return pitcherData;
}

async function getBatterProfile(batterId) {
  const now = Date.now();
  if (BATTER_CACHE.has(batterId)) {
    const cached = BATTER_CACHE.get(batterId);
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  let batterAdvStats = {};
  if (supabaseServer) {
    try {
      const res = await supabaseServer
        .from("batters")
        .select("adv_stats")
        .eq("batter_id", String(batterId))
        .maybeSingle();

      batterAdvStats = res?.data?.adv_stats || {};
      BATTER_CACHE.set(batterId, { timestamp: now, data: batterAdvStats });
      console.log(
        `⚡ [Cache Miss -> Stored] 打者 ${batterId} 已載入 BFF 記憶體快取`
      );
    } catch (e) {
      console.warn("⚠️ [Batter Fetch] 查詢失敗：", e.message);
    }
  }
  return batterAdvStats;
}

// ==============================================================================
// 路由主函式
// ==============================================================================
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

    // 🌟 3. 正確呼叫快取函式 (第一次查 DB，第 2~7 球推演 0ms 瞬間從記憶體讀出！)
    const [pitcherData, batterAdvStats] = await Promise.all([
      getPitcherProfile(pitcher_id),
      getBatterProfile(batter_id),
    ]);

    // 4. 特徵合成 (前端完全不經手物理值，零知識安全防禦)
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
      process.env.INTERNAL_API_SECRET || "dev-secret-key-change-in-prod";

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
