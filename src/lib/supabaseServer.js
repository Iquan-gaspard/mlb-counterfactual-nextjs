import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("伺服器環境變數缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY");
}

// 僅於 Next.js Server 內部運行，金鑰永遠不會被打包送出
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
