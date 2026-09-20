import { TrendingUp } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import type { WeeklyTotal } from "@/features/progress/calendar";

// A week counts as "met" from 85% of target, and as "over" past 110%.
const MET_THRESHOLD = 0.85;
const OVER_THRESHOLD = 1.1;

const BAR_OVER = "from-orange-600 to-orange-500";
const BAR_MET = "from-green-600 to-emerald-500";
const BAR_UNDER = "from-slate-700 to-slate-600";

function barClassName(total: number, weeklyTarget: number) {
  if (total > weeklyTarget * OVER_THRESHOLD) return BAR_OVER;
  return total >= weeklyTarget * MET_THRESHOLD ? BAR_MET : BAR_UNDER;
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-3 w-3 rounded-sm ${className}`} /> {label}
    </div>
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
  const max = Math.max(...weeks.map((w) => w.total), weeklyTarget);

  return (
    <Card>
      <SectionHeading size="md" className="mb-5" icon={<TrendingUp className="text-purple-400" />}>
        Weekly Calorie Intake
        <span className="ml-1 text-[10px] font-normal text-slate-500">
          vs target ({weeklyTarget.toLocaleString()} kcal/week)
        </span>
      </SectionHeading>

      <div className="relative flex h-36 items-end gap-1.5">
        <div
          className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-purple-500/40"
          style={{ bottom: `${(weeklyTarget / max) * 100}%` }}
        />
        {weeks.map((week, index) => (
          <div key={index} className="group relative flex flex-1 flex-col items-center gap-1">
            <div className="flex h-[120px] w-full flex-col justify-end">
              <div
                className={`min-h-[2px] w-full rounded-t-md bg-linear-to-t transition-all duration-500 ${barClassName(week.total, weeklyTarget)}`}
                style={{ height: `${max > 0 ? (week.total / max) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[8px] text-slate-600">{week.label}</span>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[10px] whitespace-nowrap text-slate-300 opacity-0 shadow-xl transition group-hover:opacity-100">
              {week.total > 0 ? `${Math.round(week.total).toLocaleString()} kcal` : "No data"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-500">
        <LegendSwatch className="bg-linear-to-t from-green-600 to-emerald-500" label="Goal met" />
        <LegendSwatch className="bg-linear-to-t from-orange-600 to-orange-500" label="Over goal" />
        <LegendSwatch className="bg-slate-600" label="Under goal" />
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-6 border-t border-dashed border-purple-500/60" />
          <span>Weekly target</span>
        </div>
      </div>
    </Card>
  );
}
