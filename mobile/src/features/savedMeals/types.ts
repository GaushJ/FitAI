import type { Ingredient, Macros } from "@/types/nutrition";

export interface SavedMeal {
  id: number;
  name: string;
  ingredients: Ingredient[];
  macros: Macros;
  created_at: string;
  updated_at: string;
}

/** What the editor dialog starts from — a blank meal, a saved one, or a logged one. */
export interface SavedMealDraft {
  /** null until the meal has been saved as a template. */
  id: number | null;
  name: string;
  ingredients: Ingredient[];
}
