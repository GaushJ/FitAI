import type { Ingredient, Macros } from "@/types/nutrition";

export interface MealLog {
  id: number;
  raw_transcript: string;
  date: string;
  macros: Macros;
  ingredients: Ingredient[];
}

export interface IngredientEditTarget {
  mealId: number;
  index: number;
  ingredient: Ingredient;
}

export interface TrackMealResult {
  id?: number;
  macros?: Macros;
  warning?: string;
}

export interface ScanLabelsResult {
  saved: Array<{ name: string; brand?: string | null }>;
  failed: unknown[];
}

/** Editable per-100g values + weight, as strings for controlled inputs. */
export interface IngredientEditForm {
  weight_g: string;
  calories_per_100g: string;
  protein_per_100g: string;
  carbs_per_100g: string;
  fat_per_100g: string;
}
