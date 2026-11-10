"use client";

import { useCallback, useEffect, useState } from "react";
import type { MealLog } from "@/features/meals/types";
import { fetchHistory, HISTORY_PAGE_SIZE } from "@/features/progress/api";
import type { HistoryPage } from "@/features/progress/types";

/** Paginated log of every meal, newest first. */
export function useMealHistory() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const showPage = useCallback((data: HistoryPage) => {
    setMeals(data.meals);
    setTotal(data.total);
    setPage(data.page);
    setLoading(false);
  }, []);

  // A failed load keeps showing the previous page rather than raising an error.
  const stopLoading = useCallback(() => setLoading(false), []);

  const loadPage = useCallback(
    (target: number) => fetchHistory(target).then(showPage, stopLoading),
    [showPage, stopLoading],
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

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
