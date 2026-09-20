import type { Ingredient, Macros } from "@/types/nutrition";

/** Actual amount of a nutrient for `weightG` grams, given its per-100g value (1 decimal). */
export const macroActual = (perHundred: number, weightG: number) =>
  Math.round(((perHundred * weightG) / 100) * 10) / 10;

/**
 * Sum an ingredient list's macros. `weightOf` lets callers preview alternative
 * portions without mutating the ingredients.
 */
export function sumIngredientMacros(
  ingredients: Ingredient[],
  weightOf: (ingredient: Ingredient) => number = (i) => i.weight_g,
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
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export const roundMacros = (m: Macros): Macros => ({
  calories: Math.round(m.calories),
  protein: Math.round(m.protein),
  carbs: Math.round(m.carbs),
  fat: Math.round(m.fat),
});

/** Progress toward a target as a whole percentage, capped at 150. */
export const percentOf = (current: number, target: number) =>
  !target ? 0 : Math.min(Math.round((current / target) * 100), 150);

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

/** Atwater general factors (USDA / FAO): energy per gram of each macronutrient. */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

type MacroGrams = Pick<Macros, "protein" | "carbs" | "fat">;

export const caloriesFromMacros = ({ protein, carbs, fat }: MacroGrams) =>
  Math.round(protein * KCAL_PER_GRAM.protein + carbs * KCAL_PER_GRAM.carbs + fat * KCAL_PER_GRAM.fat);

/** Rescale a macro split (keeping its ratios) so it adds up to `calories`; grams are whole numbers. */
export function scaleMacrosToCalories(macros: MacroGrams, calories: number): MacroGrams {
  const current = caloriesFromMacros(macros);
  if (current <= 0) return macros;
  const factor = calories / current;
  return {
    protein: Math.round(macros.protein * factor),
    carbs: Math.round(macros.carbs * factor),
    fat: Math.round(macros.fat * factor),
  };
}
