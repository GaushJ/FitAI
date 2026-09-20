import { View, Text } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { GOAL_OPTIONS } from "../bodyProfile";
import type { TargetPlan } from "../types";

const kcal = (n: number) => `${n.toLocaleString("en-US")} kcal`;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[46%] flex-1 rounded-xs bg-surface-high px-3 py-2">
      <Text className="font-sans-bold text-[9px] uppercase tracking-widest text-text-muted">{label}</Text>
      <Text className="font-mono text-xs text-text-primary">{value}</Text>
    </View>
  );
}

/** How the suggestion was reached — BMR → maintenance → goal adjustment — plus any safety notes. */
export function PlanSummary({ plan }: { plan: TargetPlan }) {
  const goal = GOAL_OPTIONS.find((o) => o.value === plan.goal)?.label ?? plan.goal;
  const adjustment = plan.calorie_adjustment;
  // Macro rounding leaves a few kcal of noise, so tiny adjustments read as "none".
  const negligible = Math.abs(adjustment) < 10;
  const adjustmentLabel = negligible ? "Adjustment" : adjustment < 0 ? "Deficit" : "Surplus";

  return (
    <View className="gap-3 rounded-sm border border-accent/20 bg-bg p-3">
      <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-accent">Suggested for: {goal}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Stat label="BMR" value={kcal(plan.bmr)} />
        <Stat label="Maintenance" value={kcal(plan.tdee)} />
        <Stat label={adjustmentLabel} value={negligible ? "None" : kcal(Math.abs(adjustment))} />
        <Stat label="BMI" value={plan.bmi.toFixed(1)} />
      </View>
      <Text className="font-sans text-[10px] leading-4 text-text-muted">
        Mifflin–St Jeor equation × activity level, adjusted for your goal. Protein follows ISSN / meta-analysis
        guidelines (g per kg). Treat this as a starting point and adjust after 2–3 weeks of real progress.
      </Text>
      {plan.warnings.map((warning) => (
        <View key={warning} className="flex-row items-start gap-2 rounded-sm border border-warn/20 bg-warn/10 p-3">
          <AlertTriangle size={16} color="#fbbf24" style={{ marginTop: 1 }} />
          <Text className="flex-1 font-sans text-xs text-warn">{warning}</Text>
        </View>
      ))}
    </View>
  );
}
