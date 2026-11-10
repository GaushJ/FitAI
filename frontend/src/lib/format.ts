/** 75 → "1:15" */
export const formatDuration = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, "0")}`;

/** "2026-03-07" → "Sat, 7 Mar" (local time, avoiding the UTC-parse day shift). */
export const formatShortDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
