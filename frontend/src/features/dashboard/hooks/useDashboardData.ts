"use client";

import { useCallback, useEffect, useState } from "react";
import { isUnauthorized } from "@/lib/api/client";
import { API_BASE } from "@/lib/config";
import type { Macros } from "@/types/nutrition";
import type { MealLog } from "@/features/meals/types";
import type { UserProfile } from "@/features/settings/types";
import { fetchDashboard } from "@/features/dashboard/api";
import type { DashboardData } from "@/features/dashboard/types";

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  current_streak: 0,
  target_calories: 2000,
  target_protein: 150,
  target_carbs: 200,
  target_fat: 65,
};

const NO_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Today's profile, macro totals and meals; `refresh` re-pulls them after any mutation. */
export function useDashboardData(onUnauthorized: () => void) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [totals, setTotals] = useState<Macros>(NO_MACROS);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");

  const applyData = useCallback((data: DashboardData) => {
    setProfile(data.user);
    setTotals(data.totals);
    setMeals(data.meals);
    setConnectionError("");
    setLoading(false);
  }, []);

  const handleFailure = useCallback(
    (err: unknown) => {
      setLoading(false);
      if (isUnauthorized(err)) return onUnauthorized();
      console.error(err);
      setConnectionError(
        `Unable to connect to the FastAPI backend (${API_BASE}). Please ensure it is running and reachable.`,
      );
    },
    [onUnauthorized],
  );

  const refresh = useCallback(() => fetchDashboard().then(applyData, handleFailure), [applyData, handleFailure]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, totals, meals, loading, connectionError, refresh };
}
