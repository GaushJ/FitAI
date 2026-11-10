import type { DaySummary } from "@/features/progress/types";

/** One column of the heatmap: Sunday → Saturday, with `null` padding before the first day. */
export type CalendarWeek = Array<DaySummary | null>;

export interface MonthLabel {
  label: string;
  column: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_PER_WEEK = 7;

const parseDay = (isoDate: string) => new Date(`${isoDate}T00:00:00`);

/**
 * Lays the daily summaries (oldest first) into Sunday-aligned week columns and
 * finds the column where each new month begins.
 */
export function buildCalendar(summaries: DaySummary[]): { weeks: CalendarWeek[]; monthLabels: MonthLabel[] } {
  if (summaries.length === 0) return { weeks: [], monthLabels: [] };

  const leadingBlanks = parseDay(summaries[0].date).getDay();
  const padded: CalendarWeek = [...Array<null>(leadingBlanks).fill(null), ...summaries];

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < padded.length; i += DAYS_PER_WEEK) {
    weeks.push(padded.slice(i, i + DAYS_PER_WEEK));
  }

  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;
  weeks.forEach((week, column) => {
    const firstDay = week.find((day) => day !== null);
    if (!firstDay) return;
    const month = parseDay(firstDay.date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTHS[month], column });
      lastMonth = month;
    }
  });

  return { weeks, monthLabels };
}

export interface WeeklyTotal {
  total: number;
  /** "MM-DD" of the week's first logged-window day. */
  label: string;
}

export const weeklyTotals = (weeks: CalendarWeek[]): WeeklyTotal[] =>
  weeks.map((week) => ({
    total: week.reduce((sum, day) => sum + (day?.calories ?? 0), 0),
    label: week.find(Boolean)?.date.slice(5) ?? "",
  }));
