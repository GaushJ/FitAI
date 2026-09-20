import { View, Text } from "react-native";
import { GlassCard, ProgressBar } from "@/components/ui";
import type { Macros } from "../types";

interface MacroProgressProps {
  totals: Macros;
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

function pct(current: number, target: number): number {
  if (!target) return 0;
  return (current / target) * 100;
}

export function MacroProgress({ totals, targets }: MacroProgressProps) {
  return (
    <GlassCard className="gap-3">
      <Text className="font-sans-semibold text-sm text-text-primary">Today's Macros</Text>

      <View className="gap-1.5">
        <View className="flex-row justify-between">
          <Text className="font-sans text-xs text-text-secondary">Calories</Text>
          <Text className="font-mono text-xs text-text-primary">
            {Math.round(totals.calories)} / {Math.round(targets.calories)}
          </Text>
        </View>
        <ProgressBar percent={pct(totals.calories, targets.calories)} color="bg-macro-calories" height="h-2.5" />
      </View>

      <View className="flex-row gap-3">
        <MiniBar label="Protein" percent={pct(totals.protein, targets.protein)} color="bg-macro-protein" />
        <MiniBar label="Carbs" percent={pct(totals.carbs, targets.carbs)} color="bg-macro-carbs" />
        <MiniBar label="Fat" percent={pct(totals.fat, targets.fat)} color="bg-macro-fat" />
      </View>
    </GlassCard>
  );
}

function MiniBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <View className="flex-1 gap-1">
      <Text className="font-sans text-[10px] text-text-secondary">{label}</Text>
      <ProgressBar percent={percent} color={color} />
    </View>
  );
}
