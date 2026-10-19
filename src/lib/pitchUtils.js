/**
 * 從 Supabase 載入的投手武器庫中，檢索特定球種在特定分區的專屬物理數值
 */
export function getPitchPhysics(pitcherData, pitchType, pitchZone) {
  const pt = pitcherData?.arsenal?.find((a) => a.value === pitchType);
  if (!pt) {
    return { speed: 0.95, pfx_x: 0.0, pfx_z: 0.0 };
  }

  // 1. 優先取用該 18 分區的專屬物理特性
  if (pt.zone_stats && pt.zone_stats[pitchZone]) {
    return {
      speed: pt.zone_stats[pitchZone].speed,
      pfx_x: pt.zone_stats[pitchZone].pfx_x,
      pfx_z: pt.zone_stats[pitchZone].pfx_z,
    };
  }

  // 2. 防呆降級：退回該球種的全域平均
  if (pt.global_stats) {
    return {
      speed: pt.global_stats.speed,
      pfx_x: pt.global_stats.pfx_x,
      pfx_z: pt.global_stats.pfx_z,
    };
  }

  return { speed: 0.95, pfx_x: 0.0, pfx_z: 0.0 };
}
