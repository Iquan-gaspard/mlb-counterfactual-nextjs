import { createClient } from "@supabase/supabase-js";

// 同時相容有無前綴的變數，找不到時給空字串
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// 🌟 核心防禦：絕不在模組頂層 (Module Evaluation) throw Error！
// 找不到變數時安全回傳 null，確保 Next.js 在 build 階段可以順利編譯通過
export const supabaseServer =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
