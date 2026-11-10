import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { Notifier } from "@/hooks/useFeedback";
import { useRemoteList } from "@/hooks/useRemoteList";
import { API_BASE_URL } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/errors";
import type { Macros } from "@/types/nutrition";
import { deleteFrequentMeal, deleteMeal, getDashboard, getFrequentMeals, logFrequentMeal } from "../api";
import type { DashboardResponse, DashboardUser, FrequentMeal, MealLog } from "../types";

// Ports of web's useDashboardData, useFrequentMeals, useDeleteMeal and useExpandedMeals.

const DEFAULT_PROFILE: DashboardUser = {
  name: "",
  username: "",
  current_streak: 0,
  is_pro: false,
  target_calories: 2000,
  target_protein: 150,
  target_carbs: 200,
  target_fat: 65,
};

const NO_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Today's profile, macro totals and meals; `refresh` re-pulls them after any mutation. */
export function useDashboardData() {
  const [profile, setProfile] = useState<DashboardUser>(DEFAULT_PROFILE);
  const [totals, setTotals] = useState<Macros>(NO_MACROS);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");

  const applyData = useCallback((data: DashboardResponse) => {
    setProfile(data.user);
    setTotals(data.totals);
    setMeals(data.meals);
    setConnectionError("");
    setLoading(false);
  }, []);

  // A 401 is handled centrally by apiRequest (it signs the user out).
  const handleFailure = useCallback(() => {
    setLoading(false);
    setConnectionError(`Unable to connect to the FastAPI backend (${API_BASE_URL}). Please ensure it is running and reachable.`);
  }, []);

  const refresh = useCallback(() => getDashboard().then(applyData, handleFailure), [applyData, handleFailure]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { profile, totals, meals, loading, connectionError, refresh };
}

interface UseFrequentMealsOptions {
  notify: Notifier;
  /** Runs after a quick-log succeeds (refresh today's totals). The list refreshes itself. */
  onLogged: () => Promise<void> | void;
}

export function useFrequentMeals({ notify, onLogged }: UseFrequentMealsOptions) {
  const { items: meals, setItems, refresh } = useRemoteList(getFrequentMeals);
  const [loggingId, setLoggingId] = useState<number | null>(null);

  /** Resolves to true when the meal was logged. */
  const quickLog = async (meal: FrequentMeal, portions: Record<string, number> = {}) => {
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

export type FrequentMealsState = ReturnType<typeof useFrequentMeals>;

export function useDeleteMeal(notify: Notifier, onDeleted: () => Promise<void> | void) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const remove = async (mealId: number) => {
    setDeletingId(mealId);
    try {
      await deleteMeal(mealId);
      notify.success("Meal deleted.");
      await onDeleted();
    } catch (err) {
      notify.error(getErrorMessage(err, "Failed to delete meal."));
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, remove };
}

/** Tracks which meal cards are expanded in a list. */
export function useExpandedMeals() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  return { expandedIds, toggle };
}
