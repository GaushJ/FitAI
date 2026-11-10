import { TrendingUp } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { cn } from "@/lib/cn";
import type { WeeklyTotal } from "@/features/progress/calendar";

// A week counts as "met" from 85% of target, and as "over" past 110%.
const MET_THRESHOLD = 0.85;
const OVER_THRESHOLD = 1.1;

const BAR_OVER = "bg-primary-bright";
const BAR_MET = "bg-success-bright";
const BAR_UNDER = "bg-surface-highest";

function barClassName(total: number, weeklyTarget: number) {
  if (total > weeklyTarget * OVER_THRESHOLD) return BAR_OVER;
  return total >= weeklyTarget * MET_THRESHOLD ? BAR_MET : BAR_UNDER;
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3", className)} /> {label}
    </span>
  );
}

interface WeeklyCalorieChartProps {
  weeks: WeeklyTotal[];
  targetCalories: number;
}

/** Bar per week versus the weekly calorie target (a dashed line). */
export function WeeklyCalorieChart({ weeks, targetCalories }: WeeklyCalorieChartProps) {
  if (weeks.length === 0) return null;

  const weeklyTarget = targetCalories * 7;
  // Headroom above the tallest bar / target line so the target label never clips.
  const max = Math.max(...weeks.map((w) => w.total), weeklyTarget) * 1.15;

  return (
    <Card>
      <SectionHeading
        icon={<TrendingUp />}
        subtitle={`vs target (${weeklyTarget.toLocaleString()} kcal / week)`}
        className="mb-6 border-b border-line pb-4"
        action={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink-muted">
            <LegendSwatch className={BAR_MET} label="Goal met" />
            <LegendSwatch className={BAR_OVER} label="Over goal" />
            <LegendSwatch className={BAR_UNDER} label="Under goal" />
            <span className="flex items-center gap-1.5">
              <span className="w-5 border-t-2 border-dashed border-primary" /> Weekly target
            </span>
          </div>
        }
      >
        Weekly calorie intake
      </SectionHeading>

      <div className="relative flex h-56 items-end gap-1.5 border-b border-ink sm:gap-3">
        <div
          className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-primary/60"
          style={{ bottom: `${(weeklyTarget / max) * 100}%` }}
        >
          <span className="absolute right-0 bottom-1 border border-line bg-card px-1.5 font-mono text-[10px] text-primary">
            {weeklyTarget.toLocaleString()} kcal target
          </span>
        </div>
        {weeks.map((week, index) => (
          <div key={index} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className={cn("min-h-[3px] w-full transition-all duration-500", barClassName(week.total, weeklyTarget))}
              style={{ height: `${(week.total / max) * 100}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 bg-ink px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100">
              {week.total > 0 ? `${Math.round(week.total).toLocaleString()} kcal` : "No data"}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {weeks.map((week, index) => (
          <span key={index} className="flex-1 truncate text-center font-mono text-[10px] text-ink-muted">
            {week.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
