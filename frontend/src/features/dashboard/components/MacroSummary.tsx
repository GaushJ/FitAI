import { TrendingUp } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Spinner } from "@/components/atoms/Spinner";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { percentOf } from "@/lib/nutrition";
import type { Macros } from "@/types/nutrition";
import type { TargetKey, UserProfile } from "@/features/settings/types";

interface MacroTargetConfig {
  key: "protein" | "carbs" | "fat";
  label: string;
  targetKey: TargetKey;
  labelClassName: string;
  percentClassName: string;
  fillClassName: string;
}

const MACRO_TARGETS: MacroTargetConfig[] = [
  {
    key: "protein",
    label: "Protein",
    targetKey: "target_protein",
    labelClassName: "text-purple-300",
    percentClassName: "text-purple-400",
    fillClassName: "bg-linear-to-r from-accent to-[#AFDF33]",
  },
  {
    key: "carbs",
    label: "Carbs",
    targetKey: "target_carbs",
    labelClassName: "text-cyan-300",
    percentClassName: "text-cyan-400",
    fillClassName: "bg-linear-to-r from-cyan-600 to-teal-600",
  },
  {
    key: "fat",
    label: "Fat",
    targetKey: "target_fat",
    labelClassName: "text-rose-300",
    percentClassName: "text-rose-400",
    fillClassName: "bg-linear-to-r from-rose-600 to-orange-600",
  },
];

const caloriesFill = (percent: number) =>
  percent > 100
    ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
    : percent > 85
      ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      : "bg-accent shadow-[0_0_10px_rgba(201,242,77,0.5)]";

interface MacroSummaryProps {
  totals: Macros;
  profile: UserProfile;
  loading: boolean;
}

/** Logged intake vs. daily targets: a calorie bar and one card per macro. */
export function MacroSummary({ totals, profile, loading }: MacroSummaryProps) {
  const caloriePercent = percentOf(totals.calories, profile.target_calories);

  return (
    <Card padding="xl">
      <SectionHeading
        className="mb-6"
        icon={<TrendingUp className="text-accent" />}
        subtitle="Logged intake vs. daily targets"
        action={
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Calories</span>
            <p className="text-lg font-black text-accent">{caloriePercent}%</p>
          </div>
        }
      >
        Today&apos;s Macros
      </SectionHeading>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8 text-accent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Calories (kcal)</span>
              <span className="text-slate-400">
                <strong className="text-slate-100">{Math.round(totals.calories)}</strong> / {profile.target_calories} kcal
              </span>
            </div>
            <ProgressBar
              size="lg"
              label="Calories"
              percent={caloriePercent}
              fillClassName={caloriesFill(caloriePercent)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
            {MACRO_TARGETS.map((macro) => {
              const target = profile[macro.targetKey];
              const percent = percentOf(totals[macro.key], target);
              return (
                <div key={macro.key} className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                    <span className={macro.labelClassName}>{macro.label}</span>
                    <span className="text-slate-400">
                      {Math.round(totals[macro.key])}g / {target}g
                    </span>
                  </div>
                  <p className={`mb-2 text-[10px] font-bold ${macro.percentClassName}`}>{percent}% reached</p>
                  <ProgressBar label={macro.label} percent={percent} fillClassName={macro.fillClassName} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
