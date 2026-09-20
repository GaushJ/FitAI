import type { Ingredient, Macros } from "@/types/nutrition";

export interface FrequentMeal {
  id: number;
  display_name: string;
  ingredients: Ingredient[];
  macros: Macros;
  log_count: number;
  last_logged: string;
}

/** Ingredient name → grams overrides applied when logging. */
export type PortionOverrides = Record<string, number>;
