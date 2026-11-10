import { Alert } from "@/components/atoms/Alert";
import { cn } from "@/lib/cn";
import { GOAL_OPTIONS } from "@/features/settings/options";
import type { TargetPlan } from "@/features/settings/types";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className={cn("font-display text-xl font-semibold text-ink", tone)}>{value}</p>
    </div>
  );
}

const kcal = (n: number) => `${n.toLocaleString("en-US")} kcal`;

/** How the suggestion was reached — BMR → TDEE → goal adjustment — plus any safety notes. */
export function TargetPlanSummary({ plan }: { plan: TargetPlan }) {
  const goal = GOAL_OPTIONS.find((o) => o.value === plan.goal)?.label ?? plan.goal;
  const adjustment = plan.calorie_adjustment;
  // Macro rounding leaves a few kcal of noise, so tiny adjustments read as "none".
  const noAdjustment = Math.abs(adjustment) < 10;

  return (
    <div className="space-y-3 border border-line bg-surface-low p-4">
      <p className="flex justify-between font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        Mifflin–St Jeor summary <span className="text-primary">Goal: {goal}</span>
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="BMR" value={kcal(plan.bmr)} />
        <Stat label="TDEE" value={kcal(plan.tdee)} />
        <Stat
          label={noAdjustment ? "Adjustment" : adjustment < 0 ? "Deficit" : "Surplus"}
          value={noAdjustment ? "None" : `${adjustment > 0 ? "+" : "−"}${kcal(Math.abs(adjustment))}`}
          tone={noAdjustment ? undefined : "text-primary"}
        />
        <Stat label="Suggested" value={kcal(plan.calories)} />
      </div>
      <p className="text-xs text-ink-muted">
        BMI {plan.bmi.toFixed(1)}. Protein follows ISSN / meta-analysis guidelines (g per kg). Treat this as a starting
        point and adjust after 2–3 weeks of real progress.
      </p>
      {plan.warnings.map((warning) => (
        <Alert key={warning} tone="warning">
          {warning}
        </Alert>
      ))}
    </div>
  );
}
