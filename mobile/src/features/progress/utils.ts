import type { DaySummary } from "./types";

/** Groups daily summaries into Sunday-start week columns, padding with `null`
 * so the first real day lands in the correct day-of-week row. Shared by the
 * activity heatmap and the weekly calorie chart, which both need the same
 * 7-day columns. */
export function groupIntoWeeks(summaries: DaySummary[]): (DaySummary | null)[][] {
  if (summaries.length === 0) return [];

  const firstDow = new Date(`${summaries[0].date}T00:00:00`).getDay();
  const padded: (DaySummary | null)[] = [...Array(firstDow).fill(null), ...summaries];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: (DaySummary | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}
