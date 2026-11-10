"use client";

import { useMemo } from "react";
import { Alert } from "@/components/atoms/Alert";
import { Spinner } from "@/components/atoms/Spinner";
import { PageHeader } from "@/features/app-shell/components/PageHeader";
import { useLogout } from "@/features/auth/hooks/useAuthSession";
import { buildCalendar, weeklyTotals } from "@/features/progress/calendar";
import { ActivityHeatmap } from "@/features/progress/components/ActivityHeatmap";
import { MealHistory } from "@/features/progress/components/MealHistory";
import { StatsRow } from "@/features/progress/components/StatsRow";
import { WeeklyCalorieChart } from "@/features/progress/components/WeeklyCalorieChart";
import { useMealHistory } from "@/features/progress/hooks/useMealHistory";
import { useProgress } from "@/features/progress/hooks/useProgress";

export function ProgressScreen() {
  const logout = useLogout();
  const progress = useProgress(logout);
  const history = useMealHistory();

  const { weeks, monthLabels } = useMemo(() => buildCalendar(progress.summaries), [progress.summaries]);
  const weekly = useMemo(() => weeklyTotals(weeks), [weeks]);

  return (
    <>
      <PageHeader
        eyebrow="Last 90 days"
        title="Progress & logs"
        description="Your logging streaks, daily calories against target, and every meal you've logged."
      />

      <div className="space-y-8">
        {progress.error && (
          <Alert tone="error" size="lg">
            {progress.error}
          </Alert>
        )}

        {progress.loading ? (
          <div className="flex justify-center py-24">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : (
          <>
            <StatsRow stats={progress.stats} />
            <ActivityHeatmap weeks={weeks} monthLabels={monthLabels} />
            <WeeklyCalorieChart weeks={weekly} targetCalories={progress.targetCalories} />
          </>
        )}
        <MealHistory history={history} />
      </div>
    </>
  );
}
