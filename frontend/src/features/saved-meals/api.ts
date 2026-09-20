import { request } from "@/lib/api/client";
import type { Ingredient, Macros } from "@/types/nutrition";
import type { SavedMeal } from "@/features/saved-meals/types";

interface SavedMealPayload {
  name: string;
  ingredients: Ingredient[];
}

export const fetchSavedMeals = () => request<SavedMeal[]>("/api/saved-meals");

export const createSavedMeal = (payload: SavedMealPayload) =>
  request<SavedMeal>("/api/saved-meals", {
    method: "POST",
    json: payload,
    errorMessage: "Failed to save meal.",
  });

export const updateSavedMeal = (mealId: number, payload: SavedMealPayload) =>
  request<SavedMeal>(`/api/saved-meals/${mealId}`, {
    method: "PUT",
    json: payload,
    errorMessage: "Failed to save meal.",
  });

export const deleteSavedMeal = (mealId: number) =>
  request(`/api/saved-meals/${mealId}`, { method: "DELETE" });

/** Logs a saved meal; pass `ingredients` to override the saved quantities. */
export const logSavedMeal = (mealId: number, ingredients?: Ingredient[]) =>
  request<{ name: string; macros?: Macros }>(`/api/saved-meals/${mealId}/log`, {
    method: "POST",
    json: ingredients ? { ingredients } : {},
    errorMessage: "Logging failed",
  });
