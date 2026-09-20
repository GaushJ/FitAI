import { cn } from "@/lib/cn";
import type { CalendarWeek, MonthLabel } from "@/features/progress/calendar";
import type { TooltipState } from "@/features/progress/components/HeatmapTooltip";
import { STATUS_STYLES } from "@/features/progress/statusStyles";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_PER_WEEK = 7;

interface HeatmapGridProps {
  weeks: CalendarWeek[];
  monthLabels: MonthLabel[];
  onHover: (tooltip: TooltipState | null) => void;
}

export function HeatmapGrid({ weeks, monthLabels, onHover }: HeatmapGridProps) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        <div className="mb-1 flex pl-8">
          {weeks.map((_, column) => (
            <div key={column} className="mr-[2px] w-[14px] text-[9px] font-medium text-slate-500">
              {monthLabels.find((m) => m.column === column)?.label ?? ""}
            </div>
          ))}
        </div>

        <div className="flex gap-0">
          <div className="mr-2 flex flex-col gap-[2px]">
            {WEEKDAY_LABELS.map((day, i) => (
              <div key={day} className="flex h-[14px] w-6 items-center justify-end pr-1 text-[9px] text-slate-600">
                {i % 2 === 1 ? day.slice(0, 1) : ""}
              </div>
            ))}
          </div>

          {weeks.map((week, column) => (
            <div key={column} className="mr-[2px] flex flex-col gap-[2px]">
              {Array.from({ length: DAYS_PER_WEEK }, (_, row) => {
                const day = week[row] ?? null;
                if (!day) return <div key={row} className="h-[14px] w-[14px]" />;
                const style = STATUS_STYLES[day.status];
                return (
                  <div
                    key={row}
                    className={cn(
                      "h-[14px] w-[14px] cursor-pointer rounded-sm border border-transparent transition-all duration-100",
                      style.cell,
                      style.cellHover,
                    )}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onHover({ day, x: rect.left, y: rect.top - 8 });
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
