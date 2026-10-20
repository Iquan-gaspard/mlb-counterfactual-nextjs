import fs from "fs";
import path from "path";

// 🌟 Node.js 伺服器程序內部常駐快取 (讀取磁碟一次後永久留在 RAM，耗時 0ms)
let localPitchersCache = null;
let localBattersCache = null;
let localAtbatsCache = null;

const DATA_DIR = path.join(process.cwd(), "data");

export function getLocalPitchers() {
  if (localPitchersCache) return localPitchersCache;
  const filePath = path.join(DATA_DIR, "pitchers.json");
  if (fs.existsSync(filePath)) {
    localPitchersCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return localPitchersCache;
  }
  return null;
}

export function getLocalBatters() {
  if (localBattersCache) return localBattersCache;
  const filePath = path.join(DATA_DIR, "batters.json");
  if (fs.existsSync(filePath)) {
    localBattersCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return localBattersCache;
  }
  return null;
}

export function getLocalAtbats(pitcherId) {
  if (!localAtbatsCache) {
    const filePath = path.join(DATA_DIR, "atbats.json");
    if (fs.existsSync(filePath)) {
      localAtbatsCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  }
  return localAtbatsCache ? localAtbatsCache[String(pitcherId)] || [] : null;
}
