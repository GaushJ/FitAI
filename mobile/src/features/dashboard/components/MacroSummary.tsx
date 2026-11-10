import { Pressable, Text, View } from "react-native";
import { ArrowRight, Beef, Droplet, Flame, Info, Wheat, type LucideIcon } from "lucide-react-native";
import { ProgressBar } from "@/components/ui";
import { percentOf } from "@/lib/nutrition";
import { colors, shadows } from "@/theme/colors";
import type { Macros } from "@/types/nutrition";
import type { DashboardUser } from "../types";

// Port of web's features/dashboard/components/MacroSummary.tsx.
type TargetKey = "target_calories" | "target_protein" | "target_carbs" | "target_fat";

interface MacroCardConfig {
  key: keyof Macros;
  label: string;
  unit: "kcal" | "g";
  targetKey: TargetKey;
  icon: LucideIcon;
  /** Protein is the number most users chase, so its card is emphasised. */
  hero?: boolean;
}

const CARDS: MacroCardConfig[] = [
  { key: "calories", label: "Calories", unit: "kcal", targetKey: "target_calories", icon: Flame },
  { key: "protein", label: "Protein", unit: "g", targetKey: "target_protein", icon: Beef, hero: true },
  { key: "carbs", label: "Carbs", unit: "g", targetKey: "target_carbs", icon: Wheat },
  { key: "fat", label: "Fat", unit: "g", targetKey: "target_fat", icon: Droplet },
];

const formatAmount = (value: number, unit: "kcal" | "g") => (unit === "g" ? `${value}g` : `${value} kcal`);

function MacroCard({ config, consumed, target }: { config: MacroCardConfig; consumed: number; target: number }) {
  const { label, unit, icon: Icon, hero } = config;
  const percent = percentOf(consumed, target);
  const remaining = Math.round(target - consumed);
  const over = remaining < 0;

  return (
    <View
      className={`min-h-48 bg-card p-5 ${hero ? "border-2 border-primary" : "border border-line"}`}
      style={hero ? shadows.hardPrimary : undefined}
    >
      <View className="flex-row items-center justify-between">
        <Text className={`font-mono-medium text-sm uppercase tracking-widest ${hero ? "text-primary" : "text-ink-muted"}`}>{label}</Text>
        <Icon size={16} color={hero ? colors.primary : colors.inkSubtle} />
      </View>

      <Text className={`mt-3 font-mono text-lg ${hero ? "text-primary" : "text-ink-muted"}`}>
        <Text className={`font-display text-3xl ${hero ? "text-primary" : "text-ink"}`}>{Math.round(consumed).toLocaleString()}</Text>{" "}
        / {target.toLocaleString()} {unit}
      </Text>
      <Text className={`mb-5 mt-1 font-mono text-xs ${over ? "text-danger" : "text-ink-muted"}`}>
        {over ? `${formatAmount(-remaining, unit)} over target` : `${formatAmount(remaining, unit)} remaining`}
      </Text>

      <ProgressBar
        label={label}
        percent={percent}
        className="mt-auto"
        fillClassName={over ? "bg-danger" : hero ? "bg-primary" : "bg-ink"}
      />
      <View className="mt-2 flex-row justify-between">
        <Text className={`font-mono-medium text-[11px] uppercase tracking-wide ${hero ? "text-primary" : "text-ink"}`}>{percent}% reached</Text>
        <Text className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Target {target.toLocaleString()}</Text>
      </View>
    </View>
  );
}

interface MacroSummaryProps {
  totals: Macros;
  profile: DashboardUser;
  onAdjustTargets: () => void;
}

/** Consumed vs. target for calories and each macro, plus how calories are derived. */
export function MacroSummary({ totals, profile, onAdjustTargets }: MacroSummaryProps) {
  return (
    <View>
      <Text className="mb-3 font-mono text-sm uppercase tracking-widest text-ink">
        {"// "}01 — Daily macro targets <Text className="text-ink-subtle">· Consumed vs target</Text>
      </Text>

      <View className="gap-4">
        {CARDS.map((config) => (
          <MacroCard key={config.key} config={config} consumed={totals[config.key]} target={profile[config.targetKey]} />
        ))}
      </View>

      <View className="mt-3 gap-2 border border-line bg-surface-low px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Info size={16} color={colors.inkMuted} />
          <Text className="flex-1 font-mono text-xs text-ink-muted">Calories = 4 × protein + 4 × carbs + 9 × fat (Atwater factors)</Text>
        </View>
        <Pressable onPress={onAdjustTargets} accessibilityRole="link" className="flex-row items-center gap-1">
          <Text className="font-mono-medium text-xs text-primary underline">Adjust macro targets</Text>
          <ArrowRight size={14} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
