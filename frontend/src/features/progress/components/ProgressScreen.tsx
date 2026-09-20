"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Spinner } from "@/components/atoms/Spinner";
import { useLogout } from "@/features/auth/hooks/useAuthSession";
import { buildCalendar, weeklyTotals } from "@/features/progress/calendar";
import { ActivityHeatmap } from "@/features/progress/components/ActivityHeatmap";
import { MealHistory } from "@/features/progress/components/MealHistory";
import { StatsRow } from "@/features/progress/components/StatsRow";
import { WeeklyCalorieChart } from "@/features/progress/components/WeeklyCalorieChart";
import { useMealHistory } from "@/features/progress/hooks/useMealHistory";
import { useProgress } from "@/features/progress/hooks/useProgress";

export function ProgressScreen() {
  const router = useRouter();
  const logout = useLogout();
  const progress = useProgress(logout);
  const history = useMealHistory();

  const { weeks, monthLabels } = useMemo(() => buildCalendar(progress.summaries), [progress.summaries]);
  const weekly = useMemo(() => weeklyTotals(weeks), [weeks]);

  return (
    <div className="relative min-h-screen bg-slate-950 pb-16 font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
      <div className="pointer-events-none absolute top-0 left-1/3 h-160 w-160 rounded-full bg-purple-900/8 blur-[120px]" />

      <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-slate-900 bg-slate-950/80 px-6 py-4 backdrop-blur-md md:px-12">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Back to dashboard"
          className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-tr from-purple-600 to-indigo-600">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Progress Overview</h1>
            <p className="text-[10px] text-slate-500">Last 90 days · Calorie &amp; macro history</p>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-5xl space-y-8 px-4 md:px-8">
        {progress.error && (
          <Alert tone="error" size="lg">
            {progress.error}
          </Alert>
        )}

        {progress.loading ? (
          <div className="flex items-center justify-center py-32">
            <Spinner className="size-10 text-purple-500" />
          </div>
        ) : (
          <>
            <StatsRow stats={progress.stats} />
            <ActivityHeatmap weeks={weeks} monthLabels={monthLabels} />
            <WeeklyCalorieChart weeks={weekly} targetCalories={progress.targetCalories} />
            <MealHistory history={history} />
          </>
        )}
      </main>
    </div>
  );
}
