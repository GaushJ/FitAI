import { useMemo } from "react";
import { View, Text } from "react-native";
import { TrendingUp } from "lucide-react-native";
import { groupIntoWeeks } from "../utils";
import type { DaySummary } from "../types";

interface WeeklyChartProps {
  summaries: DaySummary[];
  targetCalories: number;
}

const BAR_HEIGHT = 100;

export function WeeklyChart({ summaries, targetCalories }: WeeklyChartProps) {
  const weeklyTarget = targetCalories * 7;

  const bars = useMemo(() => {
    const weeks = groupIntoWeeks(summaries);
    return weeks.map((week) => {
      const total = week.reduce((sum, day) => sum + (day?.calories ?? 0), 0);
      return { total };
    });
  }, [summaries]);

  const maxWeekly = Math.max(...bars.map((b) => b.total), weeklyTarget, 1);
  const targetPct = Math.min(100, (weeklyTarget / maxWeekly) * 100);

  return (
    <View className="gap-1 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center gap-1.5">
        <TrendingUp size={13} color="#C9F24D" />
        <Text className="font-display text-sm text-text-primary">Weekly Calorie Intake</Text>
      </View>
      <Text className="mb-2.5 font-sans text-[10px] text-text-secondary">
        vs target ({weeklyTarget.toLocaleString()} kcal/week)
      </Text>

      <View style={{ height: BAR_HEIGHT }} className="relative flex-row items-end gap-[3px]">
        <View
          className="absolute left-0 right-0 border-t border-dashed border-accent/40"
          style={{ bottom: `${targetPct}%` }}
        />
        {bars.map((bar, i) => {
          const isOver = bar.total > weeklyTarget * 1.1;
          const isMet = bar.total >= weeklyTarget * 0.85 && !isOver;
          const color = bar.total === 0 ? "#1A1C12" : isOver ? "#fb923c" : isMet ? "#34d399" : "#2A2D1E";
          const heightPct = Math.max((bar.total / maxWeekly) * 100, bar.total > 0 ? 3 : 0);
          return (
            <View key={i} className="flex-1 justify-end" style={{ height: "100%" }}>
              <View className="w-full rounded-t-xs" style={{ height: `${heightPct}%`, backgroundColor: color }} />
            </View>
          );
        })}
      </View>

      <View className="mt-2.5 flex-row flex-wrap gap-2.5">
        <LegendSwatch color="#34d399" label="Goal met" />
        <LegendSwatch color="#fb923c" label="Over" />
        <View className="flex-row items-center gap-1">
          <View className="w-3.5 border-t border-dashed border-accent" />
          <Text className="font-sans text-[9px] text-text-muted">Target</Text>
        </View>
      </View>
    </View>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View className="h-[9px] w-[9px] rounded-xs" style={{ backgroundColor: color }} />
      <Text className="font-sans text-[9px] text-text-muted">{label}</Text>
    </View>
  );
}
