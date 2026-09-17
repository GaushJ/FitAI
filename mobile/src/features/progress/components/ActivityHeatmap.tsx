import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { groupIntoWeeks } from "../utils";
import type { DaySummary } from "../types";

interface ActivityHeatmapProps {
  summaries: DaySummary[];
}

const STATUS_COLOR: Record<DaySummary["status"], string> = {
  empty: "#1A1C12",
  minimal: "#4a3f16",
  under: "#1f4d3a",
  met: "#34d399",
  over: "#fb923c",
};

const STATUS_LABEL: Record<DaySummary["status"], string> = {
  empty: "No data",
  minimal: "Barely logged",
  under: "Under goal",
  met: "Goal met",
  over: "Over goal",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "M", "", "W", "", "F", ""];

function buildMonthLabels(weeks: (DaySummary | null)[][]) {
  const monthLabels: string[] = new Array(weeks.length).fill("");
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const day = week.find((d) => d !== null);
    if (!day) return;
    const month = new Date(`${day.date}T00:00:00`).getMonth();
    if (month !== lastMonth) {
      monthLabels[wi] = MONTHS[month];
      lastMonth = month;
    }
  });

  return monthLabels;
}

export function ActivityHeatmap({ summaries }: ActivityHeatmapProps) {
  const [selected, setSelected] = useState<DaySummary | null>(null);
  const weeks = useMemo(() => groupIntoWeeks(summaries), [summaries]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  return (
    <View className="gap-2.5 rounded-lg border border-border bg-surface p-4">
      <View>
        <Text className="font-display text-sm text-text-primary">Activity Heatmap</Text>
        <Text className="mt-0.5 font-sans text-[10.5px] text-text-secondary">Tap a day for details</Text>
      </View>

      <View className="flex-row gap-1.5">
        <View className="gap-[3px]">
          {DAY_LABELS.map((label, i) => (
            <View key={i} className="h-4 w-3 justify-center">
              <Text className="font-sans text-[8px] text-text-muted">{label}</Text>
            </View>
          ))}
        </View>

        <View className="gap-1">
          <View className="flex-row gap-[3px]">
            {weeks.map((_, wi) => (
              <Text key={wi} className="w-4 font-sans text-[8px] text-text-muted">
                {monthLabels[wi]}
              </Text>
            ))}
          </View>
          <View className="flex-row gap-[3px]">
            {weeks.map((week, wi) => (
              <View key={wi} className="gap-[3px]">
                {week.map((day, di) =>
                  day ? (
                    <Pressable
                      key={di}
                      onPress={() => setSelected((prev) => (prev?.date === day.date ? null : day))}
                      accessibilityRole="button"
                      accessibilityLabel={`${day.date}: ${STATUS_LABEL[day.status]}`}
                      className="h-4 w-4 rounded-xs"
                      style={{
                        backgroundColor: STATUS_COLOR[day.status],
                        borderWidth: selected?.date === day.date ? 2 : 0,
                        borderColor: "#F4F5EF",
                      }}
                    />
                  ) : (
                    <View key={di} className="h-4 w-4" />
                  )
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2.5">
        <LegendSwatch color={STATUS_COLOR.under} label="Under" />
        <LegendSwatch color={STATUS_COLOR.met} label="Goal met" />
        <LegendSwatch color={STATUS_COLOR.over} label="Over" />
        <LegendSwatch color={STATUS_COLOR.empty} label="No data" />
      </View>

      {selected ? (
        <View className="gap-1 border-t border-border-subtle pt-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-[13px] text-text-primary">
              {new Date(`${selected.date}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Text>
            <Text
              className="font-sans-bold text-[10px]"
              style={{ color: selected.status === "met" ? "#34d399" : selected.status === "over" ? "#fb923c" : "#8E9085" }}
            >
              {STATUS_LABEL[selected.status]}
            </Text>
          </View>
          <Text className="font-mono text-[13px] text-text-primary">
            {Math.round(selected.calories)} / {Math.round(selected.target_calories)} kcal
          </Text>
          <View className="flex-row gap-2.5">
            <Text className="font-mono text-[10.5px] text-macro-protein">P {selected.protein}g</Text>
            <Text className="font-mono text-[10.5px] text-macro-carbs">C {selected.carbs}g</Text>
            <Text className="font-mono text-[10.5px] text-macro-fat">F {selected.fat}g</Text>
          </View>
          <Text className="font-sans text-[10px] text-text-muted">
            {selected.meal_count} meal{selected.meal_count === 1 ? "" : "s"} logged
          </Text>
        </View>
      ) : null}
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
