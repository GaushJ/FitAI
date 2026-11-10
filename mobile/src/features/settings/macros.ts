/** Atwater general factors (USDA / FAO): energy per gram of each macronutrient. */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export interface MacroGrams {
  protein: number;
  carbs: number;
  fat: number;
}

export const caloriesFromMacros = ({ protein, carbs, fat }: MacroGrams): number =>
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
