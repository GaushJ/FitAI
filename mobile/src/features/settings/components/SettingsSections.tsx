import { Text, TextInput, View } from "react-native";
import { Calculator, Info } from "lucide-react-native";
import { Alert, Button, FormField, Input, SegmentedTabs, Select } from "@/components/ui";
import { colors } from "@/theme/colors";
import { ACTIVITY_OPTIONS, BODY_LIMITS, GOAL_OPTIONS, SEX_OPTIONS, type BodyDraft } from "../bodyProfile";
import { KCAL_PER_GRAM } from "../macros";
import type { ActivityLevel, Goal, Sex, TargetPlan } from "../types";
import type { MacroKey, TargetsDraft } from "../useTargetsForm";

// Ports of web's BodyProfileFields, MacroTargetFields and TargetPlanSummary.

const hintFor = <T extends string>(options: { value: T; hint: string }[], value: T | "") => options.find((o) => o.value === value)?.hint;

interface BodyProfileFieldsProps {
  body: BodyDraft;
  onChange: <K extends keyof BodyDraft>(key: K, value: BodyDraft[K]) => void;
  canCalculate: boolean;
  calculating: boolean;
  onCalculate: () => void;
}

export function BodyProfileFields({ body, onChange, canCalculate, calculating, onCalculate }: BodyProfileFieldsProps) {
  const limits = (key: keyof typeof BODY_LIMITS) => `${BODY_LIMITS[key].min}–${BODY_LIMITS[key].max}`;
  return (
    <View className="gap-5">
      <View>
        <Text className="mb-1.5 font-mono-medium text-[11px] uppercase tracking-widest text-ink-muted">Sex</Text>
        <SegmentedTabs<Sex | "">
          tabs={SEX_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
          value={body.sex}
          onChange={(sex) => onChange("sex", sex)}
        />
      </View>

      <View className="flex-row gap-3">
        <FormField label="Age (yr)" className="flex-1">
          <Input keyboardType="numeric" accessibilityLabel={`Age (yr), ${limits("age")}`} value={body.age} onChangeText={(v) => onChange("age", v)} />
        </FormField>
        <FormField label="Height (cm)" className="flex-1">
          <Input
            keyboardType="decimal-pad"
            accessibilityLabel={`Height (cm), ${limits("height_cm")}`}
            value={body.height_cm}
            onChangeText={(v) => onChange("height_cm", v)}
          />
        </FormField>
        <FormField label="Weight (kg)" className="flex-1">
          <Input
            keyboardType="decimal-pad"
            accessibilityLabel={`Weight (kg), ${limits("weight_kg")}`}
            value={body.weight_kg}
            onChangeText={(v) => onChange("weight_kg", v)}
          />
        </FormField>
      </View>

      <FormField label="Activity level" hint={hintFor(ACTIVITY_OPTIONS, body.activity_level)}>
        <Select<ActivityLevel>
          accessibilityLabel="Activity level"
          value={body.activity_level}
          placeholder="Choose activity level…"
          options={ACTIVITY_OPTIONS}
          onChange={(v) => onChange("activity_level", v)}
        />
      </FormField>

      <FormField label="Goal" hint={hintFor(GOAL_OPTIONS, body.goal)}>
        <Select<Goal> accessibilityLabel="Goal" value={body.goal} placeholder="Choose a goal…" options={GOAL_OPTIONS} onChange={(v) => onChange("goal", v)} />
      </FormField>

      <Button
        variant="outline"
        size="lg"
        fullWidth
        raised
        icon={Calculator}
        iconColor={colors.primary}
        loading={calculating}
        loadingText="Calculating..."
        disabled={!canCalculate}
        onPress={onCalculate}
      >
        Calculate my targets
      </Button>
    </View>
  );
}

const MACROS: { key: MacroKey; label: string; bar: string }[] = [
  { key: "protein", label: "Protein", bar: "bg-primary" },
  { key: "carbs", label: "Carbohydrates", bar: "bg-ink" },
  { key: "fat", label: "Dietary fat", bar: "bg-line-strong" },
];

const kcalFor = (targets: TargetsDraft, key: MacroKey) => (Number(targets[key]) || 0) * KCAL_PER_GRAM[key];

interface MacroTargetFieldsProps {
  targets: TargetsDraft;
  onMacroChange: (key: MacroKey, value: string) => void;
  onCaloriesChange: (value: string) => void;
  onCaloriesCommit: () => void;
}

/** Daily calorie target with its macro split, every number editable. */
export function MacroTargetFields({ targets, onMacroChange, onCaloriesChange, onCaloriesCommit }: MacroTargetFieldsProps) {
  const macroKcal = MACROS.reduce((sum, { key }) => sum + kcalFor(targets, key), 0);
  const share = (key: MacroKey) => (macroKcal > 0 ? (kcalFor(targets, key) / macroKcal) * 100 : 0);

  return (
    <View className="gap-4">
      <View className="border border-line bg-surface-low p-5">
        <Text className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Daily calorie target</Text>
        <View className="mt-1 flex-row items-baseline gap-2">
          <TextInput
            keyboardType="numeric"
            accessibilityLabel="Daily calorie target"
            value={targets.calories}
            onChangeText={onCaloriesChange}
            onEndEditing={onCaloriesCommit}
            onSubmitEditing={onCaloriesCommit}
            className="min-w-[3ch] p-0 font-display text-6xl text-ink"
          />
          <Text className="font-mono text-sm uppercase text-primary">kcal / day</Text>
        </View>

        <View className="mt-4 h-2.5 w-full flex-row overflow-hidden bg-surface-highest">
          {MACROS.map(({ key, bar }) => (
            <View key={key} className={`h-full ${bar}`} style={{ width: `${share(key)}%` }} />
          ))}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
          {MACROS.map(({ key, label, bar }) => (
            <View key={key} className="flex-row items-center gap-1.5">
              <View className={`h-2.5 w-2.5 ${bar}`} />
              <Text className="font-mono text-[11px] uppercase text-ink-muted">
                {label} ({share(key).toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>

      {MACROS.map(({ key, label }, index) => (
        <View key={key} className="flex-row items-center gap-4 border border-line bg-card p-4">
          <View className="min-w-0 flex-1">
            <Text className="font-display-semibold text-lg uppercase text-ink">
              <Text className="font-mono text-xs text-primary">
                {"// "}0{index + 1}{" "}
              </Text>
              {label}
            </Text>
            <Text className="font-mono text-xs text-ink-muted">≈ {Math.round(kcalFor(targets, key))} kcal</Text>
          </View>
          <View className="flex-row items-baseline gap-1 border border-line bg-surface-low px-3 py-2">
            <TextInput
              keyboardType="numeric"
              accessibilityLabel={`${label} grams`}
              value={targets[key]}
              onChangeText={(v) => onMacroChange(key, v)}
              className="w-16 p-0 text-right font-display text-2xl text-ink"
            />
            <Text className="font-mono text-xs text-ink-muted">g</Text>
          </View>
        </View>
      ))}

      <View className="flex-row gap-3 border border-line bg-surface-low p-4">
        <Info size={16} color={colors.primary} style={{ marginTop: 2 }} />
        <Text className="flex-1 font-sans text-sm text-ink-muted">
          Calories = 4 × protein + 4 × carbs + 9 × fat. Editing a macro updates total calories; editing calories rescales your
          macros, keeping their proportions.
        </Text>
      </View>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View className="w-[46%]">
      <Text className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{label}</Text>
      <Text className={`font-display-semibold text-xl ${tone ?? "text-ink"}`}>{value}</Text>
    </View>
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
    <View className="gap-3 border border-line bg-surface-low p-4">
      <View className="flex-row justify-between">
        <Text className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Mifflin–St Jeor summary</Text>
        <Text className="font-mono text-[11px] uppercase tracking-widest text-primary">Goal: {goal}</Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Stat label="BMR" value={kcal(plan.bmr)} />
        <Stat label="TDEE" value={kcal(plan.tdee)} />
        <Stat
          label={noAdjustment ? "Adjustment" : adjustment < 0 ? "Deficit" : "Surplus"}
          value={noAdjustment ? "None" : `${adjustment > 0 ? "+" : "−"}${kcal(Math.abs(adjustment))}`}
          tone={noAdjustment ? undefined : "text-primary"}
        />
        <Stat label="Suggested" value={kcal(plan.calories)} />
      </View>
      <Text className="font-sans text-xs text-ink-muted">
        BMI {plan.bmi.toFixed(1)}. Protein follows ISSN / meta-analysis guidelines (g per kg). Treat this as a starting point
        and adjust after 2–3 weeks of real progress.
      </Text>
      {plan.warnings.map((warning) => (
        <Alert key={warning} tone="warning">
          {warning}
        </Alert>
      ))}
    </View>
  );
}
