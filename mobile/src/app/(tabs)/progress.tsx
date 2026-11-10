import { useMemo } from "react";
import { View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { Alert, PageHeader, Spinner } from "@/components/ui";
import { buildCalendar, weeklyTotals } from "@/features/progress/calendar";
import { ActivityHeatmap, MealHistory, StatsRow, WeeklyCalorieChart } from "@/features/progress/components";
import { useMealHistory, useProgress } from "@/features/progress/hooks";

/** Same layout and copy as web's ProgressScreen. */
export default function ProgressScreen() {
  const progress = useProgress();
  const history = useMealHistory();

  const { weeks, monthLabels } = useMemo(() => buildCalendar(progress.summaries), [progress.summaries]);
  const weekly = useMemo(() => weeklyTotals(weeks), [weeks]);

  return (
    <AppScreen>
      <PageHeader
        eyebrow="Last 90 days"
        title="Progress & logs"
        description="Your logging streaks, daily calories against target, and every meal you've logged."
      />

      <View className="gap-8">
        {progress.error ? (
          <Alert tone="error" size="lg">
            {progress.error}
          </Alert>
        ) : null}

        {progress.loading ? (
          <Spinner className="py-24" />
        ) : (
          <>
            <StatsRow stats={progress.stats} />
            <ActivityHeatmap weeks={weeks} monthLabels={monthLabels} />
            <WeeklyCalorieChart weeks={weekly} targetCalories={progress.targetCalories} />
          </>
        )}
        <MealHistory history={history} />
      </View>
    </AppScreen>
  );
}
