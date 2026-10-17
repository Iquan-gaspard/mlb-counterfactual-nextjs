import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Supabase 環境變數未讀取到，請檢查 .env.local 並重啟 Next.js！"
  );
}
// 建立並匯出單一連線實體
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
