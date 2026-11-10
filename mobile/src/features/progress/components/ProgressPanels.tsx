import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Flame,
  TrendingUp,
  Trophy,
  Utensils,
  type LucideIcon,
} from "lucide-react-native";
import { Card, EmptyState, IconButton, SectionHeading } from "@/components/ui";
import { MealCard } from "@/features/dashboard/components";
import { useExpandedMeals } from "@/features/dashboard/hooks/useDashboardHooks";
import { formatShortDate } from "@/lib/format";
import { pluralize } from "@/lib/nutrition";
import { colors, shadows } from "@/theme/colors";
import type { CalendarWeek, MonthLabel, WeeklyTotal } from "../calendar";
import type { MealHistoryState } from "../hooks";
import type { DayStatus, DaySummary, ProgressStats } from "../types";

// Ports of web's StatsRow, ActivityHeatmap (+ HeatmapGrid, HeatmapTooltip), WeeklyCalorieChart and
// MealHistory. Web shows details on hover; on a phone they appear when a cell or bar is tapped.

const STATUS_STYLES: Record<DayStatus, { label: string; cell: string; tooltipText: string }> = {
  empty: { label: "No data", cell: "bg-surface-highest", tooltipText: "text-white/60" },
  minimal: { label: "Barely logged", cell: "bg-line-strong", tooltipText: "text-white/80" },
  under: { label: "Under goal", cell: "bg-success/35", tooltipText: "text-success-bright" },
  met: { label: "Goal met ✓", cell: "bg-success-bright", tooltipText: "text-success-bright" },
  over: { label: "Over goal", cell: "bg-primary-bright", tooltipText: "text-primary-soft" },
};

/** Statuses shown in the legend (the in-between ones are self-explanatory). */
const LEGEND_STATUSES: DayStatus[] = ["empty", "under", "met", "over"];

function StatTile({ icon: Icon, label, value, unit }: { icon: LucideIcon; label: string; value: number; unit: string }) {
  return (
    <View className="w-[48%] flex-grow border border-line bg-card p-5">
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={colors.primary} />
        <Text className="flex-shrink font-mono text-xs uppercase tracking-widest text-ink-muted">{label}</Text>
      </View>
      <View className="mt-3 flex-row items-baseline gap-2">
        <Text className="font-display text-5xl leading-none text-ink">{value}</Text>
        <Text className="font-display-semibold text-xl uppercase text-ink-muted">{unit}</Text>
      </View>
    </View>
  );
}

export function StatsRow({ stats }: { stats: ProgressStats | null }) {
  return (
    <View className="flex-row flex-wrap gap-4">
      <StatTile icon={Flame} label="Current streak" value={stats?.current_streak ?? 0} unit="days" />
      <StatTile icon={Trophy} label="Best streak" value={stats?.best_streak ?? 0} unit="days" />
      <StatTile icon={CalendarCheck} label="Days logged" value={stats?.total_days_logged ?? 0} unit="days" />
      <StatTile icon={Utensils} label="Total meals" value={stats?.total_meals ?? 0} unit="meals" />
    </View>
  );
}

function Legend({ items }: { items: { swatch: React.ReactNode; label: string }[] }) {
  return (
    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
      {items.map(({ swatch, label }) => (
        <View key={label} className="flex-row items-center gap-1.5">
          {swatch}
          <Text className="font-mono text-xs text-ink-muted">{label}</Text>
        </View>
      ))}
    </View>
  );
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/** 90-day calorie heatmap; tapping a cell shows the same dark tooltip web shows on hover. */
export function ActivityHeatmap({ weeks, monthLabels }: { weeks: CalendarWeek[]; monthLabels: MonthLabel[] }) {
  const [selected, setSelected] = useState<DaySummary | null>(null);

  return (
    <Card>
      <SectionHeading
        icon={BarChart3}
        subtitle="90 days of calorie logging — tap a cell for details"
        action={
          <Legend
            items={LEGEND_STATUSES.map((status) => ({
              swatch: <View className={`h-3 w-3 ${STATUS_STYLES[status].cell}`} />,
              label: STATUS_STYLES[status].label,
            }))}
          />
        }
        className="mb-6 border-b border-line pb-4"
      >
        Activity heatmap
      </SectionHeading>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="pb-1">
        <View className="min-w-[560px]">
          <View className="mb-1.5 flex-row gap-1 pl-7">
            {weeks.map((_, column) => (
              <Text key={column} className="flex-1 font-mono text-[11px] text-ink-muted">
                {monthLabels.find((m) => m.column === column)?.label ?? ""}
              </Text>
            ))}
          </View>
          <View className="flex-row gap-1">
            <View className="w-6 gap-1">
              {WEEKDAY_LABELS.map((day, i) => (
                <View key={i} className="h-4 justify-center">
                  <Text className="font-mono text-[10px] text-ink-subtle">{i % 2 === 1 ? day : ""}</Text>
                </View>
              ))}
            </View>
            {weeks.map((week, column) => (
              <View key={column} className="flex-1 gap-1">
                {Array.from({ length: 7 }, (_, row) => {
                  const day = week[row] ?? null;
                  if (!day) return <View key={row} className="h-4" />;
                  const active = selected?.date === day.date;
                  return (
                    <Pressable
                      key={row}
                      accessibilityRole="button"
                      accessibilityLabel={`${formatShortDate(day.date)}: ${STATUS_STYLES[day.status].label}`}
                      onPress={() => setSelected(active ? null : day)}
                      className={`h-4 ${STATUS_STYLES[day.status].cell} ${active ? "border-2 border-ink" : ""}`}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {selected ? (
        <View className="mt-4 self-start bg-ink px-3 py-2" style={shadows.hardSm}>
          <Text className="font-mono-medium text-xs text-white">{formatShortDate(selected.date)}</Text>
          <Text className={`mt-0.5 font-mono text-xs ${STATUS_STYLES[selected.status].tooltipText}`}>
            {STATUS_STYLES[selected.status].label}
          </Text>
          {selected.calories > 0 ? (
            <Text className="mt-1 font-mono text-xs text-white/80">
              {Math.round(selected.calories)} / {Math.round(selected.target_calories)} kcal · {Math.round(selected.protein)}g P ·{" "}
              {pluralize(selected.meal_count, "meal")}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

// A week counts as "met" from 85% of target, and as "over" past 110% (same thresholds as web).
const MET_THRESHOLD = 0.85;
const OVER_THRESHOLD = 1.1;
const BAR_OVER = "bg-primary-bright";
const BAR_MET = "bg-success-bright";
const BAR_UNDER = "bg-surface-highest";
const CHART_HEIGHT = 224;

function barClassName(total: number, weeklyTarget: number) {
  if (total > weeklyTarget * OVER_THRESHOLD) return BAR_OVER;
  return total >= weeklyTarget * MET_THRESHOLD ? BAR_MET : BAR_UNDER;
}

/** Bar per week versus the weekly calorie target (a dashed line). */
export function WeeklyCalorieChart({ weeks, targetCalories }: { weeks: WeeklyTotal[]; targetCalories: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  if (weeks.length === 0) return null;

  const weeklyTarget = targetCalories * 7;
  // Headroom above the tallest bar / target line so the target label never clips.
  const max = Math.max(...weeks.map((w) => w.total), weeklyTarget) * 1.15;

  return (
    <Card>
      <SectionHeading
        icon={TrendingUp}
        subtitle={`vs target (${weeklyTarget.toLocaleString()} kcal / week)`}
        className="mb-6 border-b border-line pb-4"
        action={
          <Legend
            items={[
              { swatch: <View className={`h-3 w-3 ${BAR_MET}`} />, label: "Goal met" },
              { swatch: <View className={`h-3 w-3 ${BAR_OVER}`} />, label: "Over goal" },
              { swatch: <View className={`h-3 w-3 ${BAR_UNDER}`} />, label: "Under goal" },
              { swatch: <View className="w-5 border-t-2 border-dashed border-primary" />, label: "Weekly target" },
            ]}
          />
        }
      >
        Weekly calorie intake
      </SectionHeading>

      <View className="relative flex-row items-end gap-1.5 border-b border-ink" style={{ height: CHART_HEIGHT }}>
        <View
          pointerEvents="none"
          className="absolute inset-x-0 z-10 border-t-2 border-dashed border-primary/60"
          style={{ bottom: `${(weeklyTarget / max) * 100}%` }}
        >
          <Text className="absolute bottom-1 right-0 border border-line bg-card px-1.5 font-mono text-[10px] text-primary">
            {weeklyTarget.toLocaleString()} kcal target
          </Text>
        </View>
        {weeks.map((week, index) => (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Week of ${week.label}`}
            onPress={() => setSelected(selected === index ? null : index)}
            className="h-full flex-1 justify-end"
          >
            {selected === index ? (
              <View className="absolute bottom-full z-20 mb-2 self-center bg-ink px-2 py-1">
                <Text className="font-mono text-[11px] text-white" numberOfLines={1}>
                  {week.total > 0 ? `${Math.round(week.total).toLocaleString()} kcal` : "No data"}
                </Text>
              </View>
            ) : null}
            <View className={`min-h-[3px] w-full ${barClassName(week.total, weeklyTarget)}`} style={{ height: `${(week.total / max) * 100}%` }} />
          </Pressable>
        ))}
      </View>
      <View className="mt-2 flex-row gap-1.5">
        {weeks.map((week, index) => (
          <Text key={index} numberOfLines={1} className="flex-1 text-center font-mono text-[10px] text-ink-muted">
            {week.label}
          </Text>
        ))}
      </View>
    </Card>
  );
}

export function MealHistory({ history }: { history: MealHistoryState }) {
  const expanded = useExpandedMeals();

  return (
    <Card>
      <SectionHeading
        icon={BookOpen}
        subtitle={`${history.total} meals logged in total`}
        className="mb-6 border-b border-line pb-4"
        action={
          <View className="flex-row items-center gap-3">
            <Text className="font-mono text-xs uppercase tracking-widest text-ink">Page {history.page}</Text>
            <View className="flex-row border border-line">
              <IconButton
                label="Previous page"
                icon={ArrowLeft}
                disabled={!history.hasPrevious || history.loading}
                onPress={() => history.goToPage(history.page - 1)}
              />
              <IconButton
                label="Next page"
                icon={ArrowRight}
                className="border-l border-line"
                disabled={!history.hasNext || history.loading}
                onPress={() => history.goToPage(history.page + 1)}
              />
            </View>
          </View>
        }
      >
        Meal history
      </SectionHeading>

      {history.loading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : history.meals.length === 0 ? (
        <EmptyState bordered={false}>No meals logged yet. Start tracking on the dashboard!</EmptyState>
      ) : (
        <View className="gap-3">
          {history.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              dateLabel={formatShortDate(meal.date)}
              expanded={expanded.expandedIds.has(meal.id)}
              onToggle={() => expanded.toggle(meal.id)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}
