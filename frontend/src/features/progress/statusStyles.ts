import type { DayStatus } from "@/features/progress/types";

interface StatusStyle {
  label: string;
  cell: string;
  /** Text colour for the status line in the tooltip. */
  tooltipText: string;
}

export const STATUS_STYLES: Record<DayStatus, StatusStyle> = {
  empty: { label: "No data", cell: "bg-surface-highest", tooltipText: "text-white/60" },
  minimal: { label: "Barely logged", cell: "bg-line-strong", tooltipText: "text-white/80" },
  under: { label: "Under goal", cell: "bg-success/35", tooltipText: "text-success-bright" },
  met: { label: "Goal met ✓", cell: "bg-success-bright", tooltipText: "text-success-bright" },
  over: { label: "Over goal", cell: "bg-primary-bright", tooltipText: "text-primary-soft" },
};

/** Statuses shown in the legend (the in-between ones are self-explanatory). */
export const LEGEND_STATUSES: DayStatus[] = ["empty", "under", "met", "over"];
