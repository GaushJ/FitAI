import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/format";
import { pluralize } from "@/lib/nutrition";
import { STATUS_STYLES } from "@/features/progress/statusStyles";
import type { DaySummary } from "@/features/progress/types";

export interface TooltipState {
  day: DaySummary;
  /** Viewport coordinates of the hovered cell's top-left corner. */
  x: number;
  y: number;
}

export function HeatmapTooltip({ day, x, y }: TooltipState) {
  const status = STATUS_STYLES[day.status];

  return (
    <div
      className="pointer-events-none fixed z-50 -translate-y-full bg-ink px-3 py-2 font-mono text-xs text-white shadow-hard-sm"
      style={{ left: x, top: y - 6 }}
    >
      <p className="font-medium">{formatShortDate(day.date)}</p>
      <p className={cn("mt-0.5", status.tooltipText)}>{status.label}</p>
      {day.calories > 0 && (
        <p className="mt-1 text-white/80">
          {Math.round(day.calories)} / {Math.round(day.target_calories)} kcal · {Math.round(day.protein)}g P ·{" "}
          {pluralize(day.meal_count, "meal")}
        </p>
      )}
    </div>
  );
}
