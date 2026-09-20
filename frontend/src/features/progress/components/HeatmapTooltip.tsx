import { MacroInline } from "@/components/molecules/MacroInline";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/format";
import { pluralize } from "@/lib/nutrition";
import { STATUS_STYLES } from "@/features/progress/statusStyles";
import type { DaySummary } from "@/features/progress/types";

export interface TooltipState {
  day: DaySummary;
  /** Viewport coordinates of the hovered cell. */
  x: number;
  y: number;
}

export function HeatmapTooltip({ day, x, y }: TooltipState) {
  const status = STATUS_STYLES[day.status];

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs shadow-2xl"
      style={{ left: x + 18, top: y - 60 }}
    >
      <p className="font-bold text-slate-200">{formatShortDate(day.date)}</p>
      <p className={cn("mt-0.5 font-semibold", status.tooltipText)}>{status.label}</p>
      {day.calories > 0 && (
        <>
          <p className="mt-1 text-slate-400">
            {Math.round(day.calories)} / {Math.round(day.target_calories)} kcal
          </p>
          <MacroInline macros={day} showCalories={false} className="mt-0.5" />
          <p className="text-[10px] text-slate-500">{pluralize(day.meal_count, "meal")}</p>
        </>
      )}
    </div>
  );
}
