"use client";

import { useState } from "react";
import type { Notifier } from "@/hooks/useFeedback";
import { useRemoteList } from "@/hooks/useRemoteList";
import { getErrorMessage } from "@/lib/errors";
import { deleteSavedMeal, fetchSavedMeals, logSavedMeal } from "@/features/saved-meals/api";
import type { SavedMeal } from "@/features/saved-meals/types";

interface UseSavedMealsOptions {
  notify: Notifier;
  /** Runs after a meal is logged (refresh today's totals, etc.). */
  onLogged: () => Promise<void> | void;
}

export function useSavedMeals({ notify, onLogged }: UseSavedMealsOptions) {
  const { items: meals, setItems, refresh } = useRemoteList(fetchSavedMeals);
  const [loggingId, setLoggingId] = useState<number | null>(null);

  /** One-tap log, exactly as saved. */
  const logAsSaved = async (meal: SavedMeal) => {
    setLoggingId(meal.id);
    notify.clear();
    try {
      const data = await logSavedMeal(meal.id);
      notify.success(`Logged "${data.name}" — ${Math.round(data.macros?.calories ?? 0)} kcal`);
      await onLogged();
    } catch (err) {
      notify.error(getErrorMessage(err, "Failed to log meal."));
    } finally {
      setLoggingId(null);
    }
  };

  const remove = async (mealId: number) => {
    try {
      await deleteSavedMeal(mealId);
      setItems((prev) => prev.filter((m) => m.id !== mealId));
    } catch {
      /* silent — the card simply stays */
    }
  };

  return { meals, refresh, loggingId, logAsSaved, remove };
}
