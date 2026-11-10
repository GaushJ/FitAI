import { request } from "@/lib/api/client";
import type { Macros } from "@/types/nutrition";
import type { FrequentMeal, PortionOverrides } from "@/features/frequent-meals/types";

export const fetchFrequentMeals = () => request<FrequentMeal[]>("/api/frequent-meals");

export const deleteFrequentMeal = (mealId: number) =>
  request(`/api/frequent-meals/${mealId}`, { method: "DELETE" });

export const logFrequentMeal = (mealId: number, portions: PortionOverrides) =>
  request<{ display_name: string; macros?: Macros }>(`/api/frequent-meals/${mealId}/log`, {
    method: "POST",
    json: { portions },
    errorMessage: "Quick-log failed",
  });
