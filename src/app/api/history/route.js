import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    const body = await request.json();

    // 零信任輸入檢查：限制單次儲存必須包含 sequence_data 且不可超過 7 顆球
    if (
      !body.sequence_data ||
      !Array.isArray(body.sequence_data) ||
      body.sequence_data.length > 7
    ) {
      return NextResponse.json({ error: "無效的配球數據" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("pitch_histories")
      .insert([
        {
          pitcher_id: String(body.pitcher_id),
          batter_id: String(body.batter_id),
          stand: String(body.stand),
          sequence_data: body.sequence_data,
        },
      ]);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("❌ [BFF] 儲存配球歷史失敗：", err.message);
    return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  }
}
