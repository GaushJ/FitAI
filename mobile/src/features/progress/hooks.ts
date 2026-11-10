import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getErrorMessage } from "@/lib/errors";
import { fetchHistory, fetchProgress, HISTORY_PAGE_SIZE } from "./api";
import type { DaySummary, HistoryMeal, HistoryResponse, ProgressStats } from "./types";

// Ports of web's useProgress and useMealHistory; both reload when the tab regains focus.
const DEFAULT_TARGET_CALORIES = 2000;

/** The 90-day summaries, streak stats and calorie target behind the progress charts. */
export function useProgress() {
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [targetCalories, setTargetCalories] = useState(DEFAULT_TARGET_CALORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchProgress()
        .then((data) => {
          if (cancelled) return;
          setSummaries(data.summaries);
          setStats(data.stats);
          setTargetCalories(data.target_calories);
          setError("");
        })
        .catch((err) => {
          if (!cancelled) setError(getErrorMessage(err, "Network error"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return { summaries, stats, targetCalories, loading, error };
}

/** Paginated log of every meal, newest first. */
export function useMealHistory() {
  const [meals, setMeals] = useState<HistoryMeal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const showPage = useCallback((data: HistoryResponse) => {
    setMeals(data.meals);
    setTotal(data.total);
    setPage(data.page);
    setLoading(false);
  }, []);

  // A failed load keeps showing the previous page rather than raising an error.
  const stopLoading = useCallback(() => setLoading(false), []);

  const loadPage = useCallback((target: number) => fetchHistory(target).then(showPage, stopLoading), [showPage, stopLoading]);

  useFocusEffect(
    useCallback(() => {
      void loadPage(1);
    }, [loadPage])
  );

  const goToPage = (target: number) => {
    setLoading(true);
    return loadPage(target);
  };

  return {
    meals,
    total,
    page,
    loading,
    hasPrevious: page > 1,
    hasNext: meals.length >= HISTORY_PAGE_SIZE,
    goToPage,
  };
}

export type MealHistoryState = ReturnType<typeof useMealHistory>;
