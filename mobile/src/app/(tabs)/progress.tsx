import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Banner, LoadingSpinner } from "@/components/ui";
import { getHistory, getProgress } from "@/features/progress/api";
import { ActivityHeatmap, HistoryList, StatsGrid, WeeklyChart } from "@/features/progress/components";
import type { HistoryResponse, ProgressResponse } from "@/features/progress/types";

const HISTORY_PER_PAGE = 15;

export default function ProgressScreen() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const result = await getHistory(page, HISTORY_PER_PAGE);
      setHistory(result);
      setHistoryPage(result.page);
    } catch {
      // The progress summary above already surfaces a connectivity error if the backend is down.
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [progressRes] = await Promise.all([getProgress(), loadHistory(1)]);
        setProgress(progressRes);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to connect to the backend.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadHistory]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <View className="px-4 pb-1 pt-3">
        <Text className="font-display text-lg text-text-primary">Progress</Text>
        <Text className="mt-0.5 font-sans text-[11px] text-text-secondary">Last 90 days &middot; calorie &amp; macro history</Text>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView contentContainerClassName="gap-4 p-4" contentInsetAdjustmentBehavior="automatic">
          {error ? <Banner variant="error" message={error} /> : null}

          {progress ? (
            <>
              <StatsGrid stats={progress.stats} />
              <ActivityHeatmap summaries={progress.summaries} />
              <WeeklyChart summaries={progress.summaries} targetCalories={progress.target_calories} />
            </>
          ) : null}

          <HistoryList
            meals={history?.meals ?? []}
            total={history?.total ?? 0}
            page={historyPage}
            totalPages={history?.total_pages ?? 1}
            loading={historyLoading}
            onPrevPage={() => loadHistory(historyPage - 1)}
            onNextPage={() => loadHistory(historyPage + 1)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
