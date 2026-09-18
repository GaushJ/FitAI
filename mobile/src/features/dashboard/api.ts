import { apiRequest } from "@/lib/api/client";
import type {
  DashboardResponse,
  FrequentMeal,
  MealLog,
  QuickLogResponse,
  ScanLabelsResponse,
  TrackMealResponse,
} from "./types";

export function getDashboard(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/api/dashboard");
}

export function trackMealWithText(text: string): Promise<TrackMealResponse> {
  const form = new FormData();
  form.append("text", text);
  return apiRequest<TrackMealResponse>("/api/track-meal", { method: "POST", form });
}

/** React Native's FormData accepts a {uri, name, type} file descriptor, which
 * doesn't match the DOM FormData typings apiRequest's signature is written
 * against — hence the cast. */
export function trackMealWithAudio(fileUri: string): Promise<TrackMealResponse> {
  const form = new FormData();
  form.append("file", { uri: fileUri, name: "recording.m4a", type: "audio/m4a" } as unknown as Blob);
  return apiRequest<TrackMealResponse>("/api/track-meal", { method: "POST", form });
}

export interface ScanLabelImage {
  uri: string;
  name: string;
  type: string;
}

/** See trackMealWithAudio's note above — the same {uri, name, type} cast applies here. */
export function scanNutritionLabels(images: ScanLabelImage[]): Promise<ScanLabelsResponse> {
  const form = new FormData();
  images.forEach((image) => form.append("images", image as unknown as Blob));
  return apiRequest<ScanLabelsResponse>("/api/ingredients/scan-labels", { method: "POST", form });
}

export function getFrequentMeals(): Promise<FrequentMeal[]> {
  return apiRequest<FrequentMeal[]>("/api/frequent-meals");
}

export function logFrequentMeal(id: number, portions?: Record<string, number>): Promise<QuickLogResponse> {
  return apiRequest<QuickLogResponse>(`/api/frequent-meals/${id}/log`, {
    method: "POST",
    json: { portions: portions ?? {} },
  });
}

export interface IngredientMacroPayload {
  weight_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export function updateMealIngredient(
  mealId: number,
  ingredientIndex: number,
  payload: IngredientMacroPayload
): Promise<Pick<MealLog, "id" | "ingredients" | "macros">> {
  return apiRequest(`/api/meals/${mealId}/ingredients/${ingredientIndex}`, { method: "PATCH", json: payload });
}

export function deleteMeal(mealId: number): Promise<{ status: string; meal_id: number }> {
  return apiRequest(`/api/meals/${mealId}`, { method: "DELETE" });
}
