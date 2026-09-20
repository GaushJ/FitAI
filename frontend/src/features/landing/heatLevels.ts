import { HEATMAP_CELL_COUNT } from "@/features/landing/content";

/**
 * Deterministic pseudo-random heat level (0–3) per demo cell. Seeded, so server
 * and client render the same grid and there is no hydration mismatch.
 */
export function buildHeatLevels(count = HEATMAP_CELL_COUNT, seed = 7): number[] {
  let state = seed;
  const next = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  return Array.from({ length: count }, () => {
    const r = next();
    return r < 0.28 ? 0 : r < 0.45 ? 1 : r < 0.66 ? 2 : 3;
  });
}
