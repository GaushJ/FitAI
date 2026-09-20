import type { DayStatus } from "@/features/progress/types";

interface StatusStyle {
  label: string;
  cell: string;
  cellHover: string;
  /** Text colour for the status line in the tooltip. */
  tooltipText: string;
}

export const STATUS_STYLES: Record<DayStatus, StatusStyle> = {
  empty: {
    label: "No data",
    cell: "bg-slate-800/60",
    cellHover: "",
    tooltipText: "text-slate-500",
  },
  minimal: {
    label: "Barely logged",
    cell: "bg-yellow-900/50 border-yellow-800/30",
    cellHover: "hover:bg-yellow-800/60",
    tooltipText: "text-yellow-600",
  },
  under: {
    label: "Under goal",
    cell: "bg-green-900/60 border-green-800/30",
    cellHover: "hover:bg-green-800/60",
    tooltipText: "text-green-600",
  },
  met: {
    label: "Goal met ✓",
    cell: "bg-green-500 border-green-400/30",
    cellHover: "hover:bg-green-400",
    tooltipText: "text-green-400",
  },
  over: {
    label: "Over goal",
    cell: "bg-orange-500 border-orange-400/30",
    cellHover: "hover:bg-orange-400",
    tooltipText: "text-orange-400",
  },
};

/** Statuses shown in the legend (the in-between ones are self-explanatory). */
export const LEGEND_STATUSES: DayStatus[] = ["empty", "under", "met", "over"];
