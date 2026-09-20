import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Calculator } from "lucide-react-native";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, SEX_OPTIONS, type BodyDraft } from "../bodyProfile";
import { OptionChips } from "./OptionChips";
import { TargetField } from "./TargetField";

interface BodyProfileSectionProps {
  body: BodyDraft;
  onChange: <K extends keyof BodyDraft>(key: K, value: BodyDraft[K]) => void;
  canCalculate: boolean;
  calculating: boolean;
  onCalculate: () => void;
}

/** Body stats + goal, and the button that turns them into suggested targets. */
export function BodyProfileSection({ body, onChange, canCalculate, calculating, onCalculate }: BodyProfileSectionProps) {
  return (
    <View className="gap-4">
      <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-secondary">Your body &amp; goal</Text>

      <OptionChips label="Sex" options={SEX_OPTIONS} value={body.sex} onChange={(v) => onChange("sex", v)} />

      <View className="flex-row gap-3">
        <TargetField
          label="Age (yrs)"
          value={body.age}
          onChangeText={(v) => onChange("age", v)}
          keyboardType="numeric"
          className="flex-1"
        />
        <TargetField
          label="Height (cm)"
          value={body.height_cm}
          onChangeText={(v) => onChange("height_cm", v)}
          keyboardType="decimal-pad"
          className="flex-1"
        />
        <TargetField
          label="Weight (kg)"
          value={body.weight_kg}
          onChangeText={(v) => onChange("weight_kg", v)}
          keyboardType="decimal-pad"
          className="flex-1"
        />
      </View>

      <OptionChips
        label="Activity level"
        options={ACTIVITY_OPTIONS}
        value={body.activity_level}
        onChange={(v) => onChange("activity_level", v)}
      />
      <OptionChips label="Goal" options={GOAL_OPTIONS} value={body.goal} onChange={(v) => onChange("goal", v)} />

      <Pressable
        onPress={onCalculate}
        disabled={!canCalculate || calculating}
        accessibilityRole="button"
        className={`flex-row items-center justify-center gap-2 rounded-full border border-border bg-surface-high py-3 ${
          !canCalculate || calculating ? "opacity-40" : ""
        }`}
      >
        {calculating ? <ActivityIndicator size="small" color="#C9F24D" /> : <Calculator size={15} color="#C9F24D" />}
        <Text className="font-sans-semibold text-[13px] text-text-primary">
          {calculating ? "Calculating…" : "Calculate my targets"}
        </Text>
      </Pressable>
    </View>
  );
}
