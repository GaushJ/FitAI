import { Alert } from "@/components/atoms/Alert";
import { GOAL_OPTIONS } from "@/features/settings/options";
import type { TargetPlan } from "@/features/settings/types";

const kcal = (n: number) => `${n.toLocaleString("en-US")} kcal`;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-mono text-xs font-semibold text-slate-100">{value}</p>
    </div>
  );
}

/** How the suggestion was reached — BMR → TDEE → goal adjustment — plus any safety notes. */
export function TargetPlanSummary({ plan }: { plan: TargetPlan }) {
  const goal = GOAL_OPTIONS.find((o) => o.value === plan.goal)?.label ?? plan.goal;
  const adjustment = plan.calorie_adjustment;
  // Macro rounding leaves a few kcal of noise, so tiny adjustments read as "none".
  const adjustmentLabel = Math.abs(adjustment) < 10 ? "Adjustment" : adjustment < 0 ? "Deficit" : "Surplus";

  return (
    <div className="space-y-3 rounded-xl border border-accent/20 bg-slate-950 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Suggested for: {goal}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="BMR" value={kcal(plan.bmr)} />
        <Stat label="Maintenance" value={kcal(plan.tdee)} />
        <Stat label={adjustmentLabel} value={Math.abs(adjustment) < 10 ? "None" : kcal(Math.abs(adjustment))} />
        <Stat label="BMI" value={plan.bmi.toFixed(1)} />
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Mifflin–St Jeor equation × activity level, adjusted for your goal. Protein follows ISSN / meta-analysis
        guidelines (g per kg). Treat this as a starting point and adjust after 2–3 weeks of real progress.
      </p>
      {plan.warnings.map((warning) => (
        <Alert key={warning} tone="warning">
          {warning}
        </Alert>
      ))}
    </div>
  );
}
