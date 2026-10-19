import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
// 🌟 明確告知 Next.js 這是動態 API，不要在 build 階段預先收集靜態資料
export const dynamic = "force-dynamic";

export async function POST(request) {
  // 🌟 直接拒絕任何寫入請求，回傳 403 Forbidden
  return NextResponse.json(
    { error: "Feature Disabled: 目前未開放上傳與儲存配球紀錄功能" },
    { status: 403 }
  );
  //   try {
  //     const body = await request.json();

  //     // 1. 防呆檢查：若伺服器端環境變數未就緒，回傳 503
  //     if (!supabaseServer) {
  //       return NextResponse.json(
  //         { error: "Database configuration missing or unavailable" },
  //         { status: 503 }
  //       );
  //     }

  //     // 零信任輸入檢查：限制單次儲存必須包含 sequence_data 且不可超過 7 顆球
  //     if (
  //       !body.sequence_data ||
  //       !Array.isArray(body.sequence_data) ||
  //       body.sequence_data.length > 7
  //     ) {
  //       return NextResponse.json({ error: "無效的配球數據" }, { status: 400 });
  //     }

  //     const { data, error } = await supabaseServer
  //       .from("pitch_histories")
  //       .insert([
  //         {
  //           pitcher_id: String(body.pitcher_id),
  //           batter_id: String(body.batter_id),
  //           stand: String(body.stand),
  //           sequence_data: body.sequence_data,
  //         },
  //       ]);

  //     if (error) throw error;
  //     return NextResponse.json({ success: true, data });
  //   } catch (err) {
  //     console.error("❌ [BFF] 儲存配球歷史失敗：", err.message);
  //     return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  //   }
}
