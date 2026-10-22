import fs from "fs";
import path from "path";

// 🌟 Node.js 伺服器記憶體常駐快取 (只讀磁碟一次，後續 0ms 讀取)
let cachedPitchers = null;
let cachedBatters = null;
let cachedAtbats = null;

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * 取得本機打席資料 (依 pitcher_id 快速索引)
 */
export function getLocalAtbats(pitcherId) {
  if (!cachedAtbats) {
    const filePath = path.join(DATA_DIR, "atbats.json");
    if (fs.existsSync(filePath)) {
      try {
        cachedAtbats = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (err) {
        console.error(
          "❌ [Local Loader] 解析 data/atbats.json 失敗：",
          err.message
        );
        return null;
      }
    }
  }
  return cachedAtbats ? cachedAtbats[String(pitcherId)] || [] : null;
}

/**
 * 取得本機投手清單
 */
export function getLocalPitchers() {
  if (!cachedPitchers) {
    const filePath = path.join(DATA_DIR, "pitchers.json");
    if (fs.existsSync(filePath)) {
      try {
        cachedPitchers = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (err) {
        console.error(
          "❌ [Local Loader] 解析 data/pitchers.json 失敗：",
          err.message
        );
        return null;
      }
    }
  }
  return cachedPitchers;
}

/**
 * 取得本機打者清單
 */
export function getLocalBatters() {
  if (!cachedBatters) {
    const filePath = path.join(DATA_DIR, "batters.json");
    if (fs.existsSync(filePath)) {
      try {
        cachedBatters = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (err) {
        console.error(
          "❌ [Local Loader] 解析 data/batters.json 失敗：",
          err.message
        );
        return null;
      }
    }
  }
  return cachedBatters;
}
