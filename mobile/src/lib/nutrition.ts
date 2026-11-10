import type { Ingredient, Macros } from "@/types/nutrition";

// Same helpers as frontend/src/lib/nutrition.ts so both apps compute and round identically.

/** Actual amount of a nutrient for `weightG` grams, given its per-100g value (1 decimal). */
export const macroActual = (perHundred: number, weightG: number) => Math.round(((perHundred * weightG) / 100) * 10) / 10;

/** Sum an ingredient list's macros. `weightOf` lets callers preview alternative portions. */
export function sumIngredientMacros(
  ingredients: Ingredient[],
  weightOf: (ingredient: Ingredient) => number = (i) => i.weight_g
): Macros {
  return ingredients.reduce<Macros>(
    (total, ing) => {
      const grams = weightOf(ing);
      return {
        calories: total.calories + macroActual(ing.calories_per_100g, grams),
        protein: total.protein + macroActual(ing.protein_per_100g, grams),
        carbs: total.carbs + macroActual(ing.carbs_per_100g, grams),
        fat: total.fat + macroActual(ing.fat_per_100g, grams),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export const roundMacros = (m: Macros): Macros => ({
  calories: Math.round(m.calories),
  protein: Math.round(m.protein),
  carbs: Math.round(m.carbs),
  fat: Math.round(m.fat),
});

export const actualMacros = (ing: Ingredient): Macros => ({
  calories: macroActual(ing.calories_per_100g, ing.weight_g),
  protein: macroActual(ing.protein_per_100g, ing.weight_g),
  carbs: macroActual(ing.carbs_per_100g, ing.weight_g),
  fat: macroActual(ing.fat_per_100g, ing.weight_g),
});

/** Progress toward a target as a whole percentage, capped at 150. */
export const percentOf = (current: number, target: number) =>
  !target ? 0 : Math.min(Math.round((current / target) * 100), 150);

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
