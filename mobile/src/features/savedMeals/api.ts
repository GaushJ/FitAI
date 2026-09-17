import { apiRequest } from "@/lib/api/client";
import type { LogSavedMealResponse, ResolvedIngredientMacros, SavedMeal, SavedMealIngredient } from "./types";

export function getSavedMeals(): Promise<SavedMeal[]> {
  return apiRequest<SavedMeal[]>("/api/saved-meals");
}

export function createSavedMeal(name: string, ingredients: SavedMealIngredient[]): Promise<SavedMeal> {
  return apiRequest<SavedMeal>("/api/saved-meals", { method: "POST", json: { name, ingredients } });
}

export function updateSavedMeal(id: number, name: string, ingredients: SavedMealIngredient[]): Promise<SavedMeal> {
  return apiRequest<SavedMeal>(`/api/saved-meals/${id}`, { method: "PUT", json: { name, ingredients } });
}

export function deleteSavedMeal(id: number): Promise<{ status: string; meal_id: number }> {
  return apiRequest(`/api/saved-meals/${id}`, { method: "DELETE" });
}

export function logSavedMeal(id: number, ingredients?: SavedMealIngredient[]): Promise<LogSavedMealResponse> {
  return apiRequest(`/api/saved-meals/${id}/log`, {
    method: "POST",
    json: ingredients ? { ingredients } : {},
  });
}

export function resolveIngredient(name: string, brand: string, weightG: number): Promise<ResolvedIngredientMacros> {
  return apiRequest<ResolvedIngredientMacros>("/api/resolve-ingredient", {
    method: "POST",
    json: { name, brand, weight_g: weightG },
  });
}
