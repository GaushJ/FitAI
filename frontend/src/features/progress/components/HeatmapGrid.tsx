import { cn } from "@/lib/cn";
import type { CalendarWeek, MonthLabel } from "@/features/progress/calendar";
import type { TooltipState } from "@/features/progress/components/HeatmapTooltip";
import { STATUS_STYLES } from "@/features/progress/statusStyles";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_PER_WEEK = 7;

interface HeatmapGridProps {
  weeks: CalendarWeek[];
  monthLabels: MonthLabel[];
  onHover: (tooltip: TooltipState | null) => void;
}

/** Week columns stretch to fill the card; narrow screens scroll sideways instead of squashing cells. */
export function HeatmapGrid({ weeks, monthLabels, onHover }: HeatmapGridProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[560px]">
        <div className="mb-1.5 flex gap-1 pl-7">
          {weeks.map((_, column) => (
            <div key={column} className="flex-1 font-mono text-[11px] text-ink-muted">
              {monthLabels.find((m) => m.column === column)?.label ?? ""}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          <div className="flex w-6 flex-col gap-1">
            {WEEKDAY_LABELS.map((day, i) => (
              <div key={i} className="flex h-4 items-center font-mono text-[10px] text-ink-subtle">
                {i % 2 === 1 ? day : ""}
              </div>
            ))}
          </div>

          {weeks.map((week, column) => (
            <div key={column} className="flex flex-1 flex-col gap-1">
              {Array.from({ length: DAYS_PER_WEEK }, (_, row) => {
                const day = week[row] ?? null;
                if (!day) return <div key={row} className="h-4" />;
                return (
                  <div
                    key={row}
                    className={cn("h-4 cursor-pointer transition hover:outline-2 hover:outline-ink", STATUS_STYLES[day.status].cell)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onHover({ day, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => onHover(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
