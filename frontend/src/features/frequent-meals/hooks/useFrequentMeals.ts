"use client";

import { useState } from "react";
import type { Notifier } from "@/hooks/useFeedback";
import { useRemoteList } from "@/hooks/useRemoteList";
import { getErrorMessage } from "@/lib/errors";
import { deleteFrequentMeal, fetchFrequentMeals, logFrequentMeal } from "@/features/frequent-meals/api";
import type { FrequentMeal, PortionOverrides } from "@/features/frequent-meals/types";

interface UseFrequentMealsOptions {
  notify: Notifier;
  /** Runs after a quick-log succeeds (refresh today's totals). The list refreshes itself. */
  onLogged: () => Promise<void> | void;
}

export function useFrequentMeals({ notify, onLogged }: UseFrequentMealsOptions) {
  const { items: meals, setItems, refresh } = useRemoteList(fetchFrequentMeals);
  const [loggingId, setLoggingId] = useState<number | null>(null);

  /** Resolves to true when the meal was logged. */
  const quickLog = async (meal: FrequentMeal, portions: PortionOverrides = {}) => {
    setLoggingId(meal.id);
    notify.clear();
    try {
      const data = await logFrequentMeal(meal.id, portions);
      notify.success(`Quick-logged "${data.display_name}" — ${Math.round(data.macros?.calories ?? 0)} kcal`);
      await onLogged();
      void refresh();
      return true;
    } catch (err) {
      notify.error(getErrorMessage(err, "Failed to quick-log meal."));
      return false;
    } finally {
      setLoggingId(null);
    }
  };

  const remove = async (mealId: number) => {
    try {
      await deleteFrequentMeal(mealId);
      setItems((prev) => prev.filter((m) => m.id !== mealId));
    } catch {
      /* silent — the card simply stays */
    }
  };

  return { meals, refresh, loggingId, quickLog, remove };
}
